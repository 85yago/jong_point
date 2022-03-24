import os
import shutil
import time
from typing import Literal

from fastapi import FastAPI, UploadFile
from pydantic import BaseModel

import app.calc_point as calc_point
import app.detect_pai as detect_pai
import app.half_image as half_image

app = FastAPI(root_path="/api")


class agari_model(BaseModel):
    bingpai: str

    fulou0: str
    fulou1: str
    fulou2: str
    fulou3: str

    fulou0type: Literal["pon", "chi", "ankan", "minkan", "none"]
    fulou1type: Literal["pon", "chi", "ankan", "minkan", "none"]
    fulou2type: Literal["pon", "chi", "ankan", "minkan", "none"]
    fulou3type: Literal["pon", "chi", "ankan", "minkan", "none"]

    dora0: str
    dora1: str
    dora2: str
    dora3: str
    dora4: str
    dora5: str
    dora6: str
    dora7: str

    agari: Literal["ron", "tumo"]

    zikaze: Literal["0", "1", "2", "3"]
    bakaze: Literal["0", "1", "2", "3"]

    riiti: str
    ippatu: str
    krt: str
    tenhou: str


@app.post("/detect")
async def detect(uploaded_file: UploadFile):
    # unixtimeを頭に付けてファイルパスの生成
    path = f"./uploaded_images/{int(time.time())}_{uploaded_file.filename}"

    # 画像の確認
    if not os.path.splitext(path)[1] in [
        ".JPG",
        ".jpg",
        ".PNG",
        ".png",
        ".JFIF",
        ".jfif",
    ]:
        # 対応していない拡張子の場合エラーを返す
        print("half_image: May not picture?")
        return {"error": "may not picture."}

    # 保存
    with open(path, mode="xb") as buffer:
        uploaded_file.file.seek(0)
        shutil.copyfileobj(uploaded_file.file, buffer)

    # 解像度を半分にして保存
    half_image_path = half_image.half_image(path)

    # 画像のpathから読み取ったデータを返す
    ret = detect_pai.imgpath_to_det_result(half_image_path)

    return ret

    # if ret == 0:
    #     # 読み取りデータの返却
    #     return {
    #         "bingpai": "5s1p1p1p1p1p1p1p",
    #         "win_tile": "1p",
    #         "fulou": [["8s8s8s"], [], [], []],
    #         "tiles": "5s1p1p1p1p1p1p1p8s8s8s",
    #     }  # ! 仮データ
    # else:
    #     return {"error": "something wrong."}


@app.post("/calc")
def calc(det_dict: agari_model):
    # {
    #   "bingpai": "3s4s5s6p6p6p2s2s",
    #   "fulou0": "1z1z1z",
    #   "fulou1": "6s7s8s",
    #   "fulou2": "",
    #   "fulou3": "",
    #   "fulou0type": "pon",
    #   "fulou1type": "chi",
    #   "fulou2type": "none",
    #   "fulou3type": "none",
    #   "dora0": "",
    #   "dora1": "",
    #   "dora2": "",
    #   "dora3": "",
    #   "dora4": "",
    #   "dora5": "",
    #   "dora6": "",
    #   "dora7": "",
    #   "agari": "tumo",
    #   "zikaze": "0",
    #   "bakaze": "0",
    #   "riiti": "none",
    #   "ippatu": "false",
    #   "krt": "none",
    #   "tenhou": "none"
    # }

    calc_result = calc_point.formdata_to_point(dict(det_dict))
    retd = dict(
        {
            "han": calc_result.han,
            "fu": calc_result.fu,
            "cost": calc_result.cost,
            "yaku": str(calc_result.yaku),
            "fu_details": calc_result.fu_details,
        }
    )

    # {
    #   "han": 2,
    #   "fu": 40,
    #   "cost": {
    #     "main": 1300,
    #     "main_bonus": 0,
    #     "additional": 1300,
    #     "additional_bonus": 0,
    #     "kyoutaku_bonus": 0,
    #     "total": 3900,
    #     "yaku_level": ""
    #   },
    #   "yaku": "[Yakuhai (wind of place), Yakuhai (wind of round)]",
    #   "fu_details": [
    #     {
    #       "fu": 20,
    #       "reason": "base"
    #     },
    #     {
    #       "fu": 4,
    #       "reason": "closed_pon"
    #     },
    #     {
    #       "fu": 4,
    #       "reason": "open_terminal_pon"
    #     },
    #     {
    #       "fu": 2,
    #       "reason": "pair_wait"
    #     },
    #     {
    #       "fu": 2,
    #       "reason": "tsumo"
    #     }
    #   ]
    # }
    return retd
