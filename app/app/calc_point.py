import itertools
import json
import os
import sys

import pandas as pd
from mahjong.constants import EAST, NORTH, SOUTH, WEST
from mahjong.hand_calculating.hand import HandCalculator
from mahjong.hand_calculating.hand_config import (
    HandConfig,
    HandConstants,
    OptionalRules,
)
from mahjong.meld import Meld
from mahjong.shanten import Shanten
from mahjong.tile import TilesConverter

import app.basic_op as b_op


def fulou_to_melds(fulou: b_op.fulou_type) -> list[Meld]:
    melds = []
    for conv in fulou[0]:
        melds.append(
            Meld(
                meld_type=Meld.PON,
                tiles=TilesConverter.one_line_string_to_136_array(
                    conv, has_aka_dora=True
                ),
            )
        )

    for conv in fulou[1]:
        melds.append(
            Meld(
                meld_type=Meld.CHI,
                tiles=TilesConverter.one_line_string_to_136_array(
                    conv, has_aka_dora=True
                ),
            )
        )

    for conv in fulou[2]:
        melds.append(
            Meld(
                meld_type=Meld.KAN,
                tiles=TilesConverter.one_line_string_to_136_array(
                    conv, has_aka_dora=True
                ),
                opened=False,
            )
        )

    for conv in fulou[3]:
        melds.append(
            Meld(
                meld_type=Meld.KAN,
                tiles=TilesConverter.one_line_string_to_136_array(
                    conv, has_aka_dora=True
                ),
                opened=True,
            )
        )

    return melds


def num_to_wind(n: str) -> int:
    num: int = int(n)
    if num == 0:
        return EAST
    elif num == 1:
        return SOUTH
    elif num == 2:
        return WEST
    elif num == 3:
        return NORTH
    else:
        return EAST


def print_detection_results(det_result: b_op.det_result_type) -> None:
    bingpai, win_tile, fulou, tiles = det_result
    print("**********************************")
    print("detection result")
    print("tehai", bingpai)
    print("win_tile", win_tile)
    pon, chi, ankan, minkan = fulou
    print("pon:", pon)
    print("chi:", chi)
    print("ankan:", ankan)
    print("minkan:", minkan)
    print("tiles", tiles)


def print_calculation_results(calc) -> None:
    print("**********************************")
    print("calc result")
    print(calc.han, "han", calc.fu, "fu")
    print(calc.cost)
    print(calc.yaku)
    print(calc.fu_details)
    print("**********************************")


def formdata_to_point(formdata: dict):
    bingpai_s: str = formdata["bingpai"]

    win_tile: int = TilesConverter.one_line_string_to_136_array(
        bingpai_s[-2:], has_aka_dora=True
    )[0]
    fulou: list[list[str]] = [[], [], [], []]
    fulou_s: str = ""
    for i in range(4):
        ac: str = "fulou{}".format(i)
        ac_type: str = "fulou{}type".format(i)
        mentu: str = formdata[ac]
        if formdata[ac_type] == "pon":
            fulou[0].append(mentu)
            fulou_s += mentu
        elif formdata[ac_type] == "chi":
            fulou[1].append(mentu)
            fulou_s += mentu
        elif formdata[ac_type] == "ankan":
            fulou[2].append(mentu)
            fulou_s += mentu
        elif formdata[ac_type] == "minkan":
            fulou[3].append(mentu)
            fulou_s += mentu
        else:
            pass

    fulou_t: b_op.fulou_type = (fulou[0], fulou[1], fulou[2], fulou[3])
    melds: list[Meld] = fulou_to_melds(fulou_t)

    tiles_s: str = ""
    tiles_s += bingpai_s
    tiles_s += fulou_s
    tiles: list[int] = TilesConverter.one_line_string_to_136_array(
        tiles_s, has_aka_dora=True
    )

    dora_indicators: list[int] = []
    for i in range(8):
        ac: str = "dora{}".format(i)
        if formdata[ac] != "":
            dora = TilesConverter.one_line_string_to_136_array(
                formdata[ac], has_aka_dora=True
            )[0]
            dora_indicators.append(dora)

    is_tsumo: bool = False
    if formdata["agari"] == "tumo":
        is_tsumo = True

    zikaze: int = num_to_wind(formdata["zikaze"])
    bakaze: int = num_to_wind(formdata["bakaze"])

    is_ippatsu: bool = False
    if "ippatsu" in formdata:
        is_ippatsu = True

    is_riiti: bool = False
    is_daburu_riichi: bool = False
    if formdata["riiti"] == "riiti":
        is_riiti = True
    elif formdata["riiti"] == "doubleriiti":
        is_daburu_riichi = True
    else:
        is_ippatsu = False  # リーチなしなら一発無効

    is_haitei: bool = False
    is_houtei: bool = False
    is_rinshan: bool = False
    is_chankan: bool = False
    if formdata["krt"] == "haitei":
        if is_tsumo == True:
            is_haitei = True  # ツモなら海底
        else:
            is_houtei = True  # ロンなら河底
    elif formdata["krt"] == "rinsyan":
        is_rinshan = True
        is_tsumo = True  # 嶺上開花はツモのみ
    elif formdata["krt"] == "tyankan":
        is_chankan = True
        is_tsumo = False  # 槍槓はツモのみ
    else:
        pass

    is_tenhou: bool = False
    is_chiihou: bool = False
    if formdata["tenhou"] == "tenhou":
        is_tenhou = True
        is_tsumo = True  # 天和・地和はツモのみ
    elif formdata["tenhou"] == "ti-hou":
        is_chiihou = True
        is_tsumo = True  # 天和・地和はツモのみ
    else:
        pass

    option = OptionalRules(
        has_open_tanyao=True,
        has_aka_dora=True,
        has_double_yakuman=True,
        kazoe_limit=HandConstants.KAZOE_LIMITED,
        kiriage=False,
        fu_for_open_pinfu=True,
        fu_for_pinfu_tsumo=False,
        renhou_as_yakuman=False,
        has_daisharin=False,
        has_daisharin_other_suits=False,
        has_sashikomi_yakuman=False,
        limit_to_sextuple_yakuman=True,
        paarenchan_needs_yaku=True,
        has_daichisei=False,
    )
    config = HandConfig(
        is_tsumo=is_tsumo,
        is_riichi=is_riiti,
        is_ippatsu=is_ippatsu,
        is_rinshan=is_rinshan,
        is_chankan=is_chankan,
        is_haitei=is_haitei,
        is_houtei=is_houtei,
        is_daburu_riichi=is_daburu_riichi,
        is_nagashi_mangan=False,
        is_tenhou=is_tenhou,
        is_renhou=False,
        is_chiihou=is_chiihou,
        is_open_riichi=False,
        player_wind=zikaze,
        round_wind=bakaze,
        kyoutaku_number=0,
        tsumi_number=0,
        paarenchan=0,
        options=option,
    )

    calculator = HandCalculator()
    calc = calculator.estimate_hand_value(
        tiles, win_tile, melds, dora_indicators, config
    )

    return calc


# # ['0m', '0p', '0s', '1h', '1m', '1p', '1s', '1z', '2h', '2m', '2p', '2s', '2z', '3h', '3m', '3p', '3s', '3z', '4h', '4m', '4p', '4s', '4z', '5m', '5p', '5s', '5z', '6m', '6p', '6s', '6z', '7m', '7p', '7s', '7z', '8m', '8p', '8s', '9m', '9p', '9s']

# https://github.com/MahjongRepository/mahjong/blob/master/mahjong/hand_calculating/hand_config.py#L38
# option = OptionalRules(has_open_tanyao=True, has_aka_dora=True)
# config = HandConfig(player_wind=EAST, round_wind=EAST, options=option)

# det_result = '{"bingpai":"3s4s0s6p7p8p2s2s","fulou0":"6s7s8s","fulou1":"1z1z1z1z","fulou2":"","fulou3":"","fulou0type":"chi","fulou1type":"minkan","fulou2type":"none","fulou3type":"none","dora0":"","dora1":"","dora2":"","dora3":"","dora4":"","dora5":"","dora6":"","dora7":"","agari":"tumo","zikaze":"0","bakaze":"0","riiti":"none","ippatu":"false","krt":"none","tenhou":"none"}'
