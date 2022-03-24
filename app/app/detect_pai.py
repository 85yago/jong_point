import itertools
import json
import os
import sys
from typing import Dict

import cv2
import pandas as pd
import torch

import app.basic_op as b_op


def imgpath_to_det_result(imgpath: str) -> Dict:
    # 画像のパスから牌認識結果を返す

    # bingpai "3s4s0s6p7p8p2s2s"
    # win_tile "2s"
    # fulou ([], ['6s7s8s'], [], ['1z1z1z1z'])
    # tiles "3s4s0s6p7p8p2s2s1z1z1z1z6s7s8s"

    # モデルの読み込み
    model = torch.hub.load(
        "ultralytics/yolov5",
        "custom",
        # force_reload=True,
        path="./model/pai_detect_model.yolov5pytorch.pt",
    )

    # 画像の読み込み
    img = cv2.imread(imgpath)
    size: int = int(max(img.shape[0], img.shape[1]))

    # 画像ないの牌を認識させる
    results = model(img, size=size)

    # xの昇順に並べ替えてインデックスを付け直す
    pai_det_data: pd.DataFrame = (
        results.pandas().xyxy[0].sort_values(by="xmax").reset_index(drop=True)
    )

    # 確信度がx以上のもののみ残してインデックスを付け直す
    pai_det_data = pai_det_data[pai_det_data["confidence"] >= 0.5].reset_index(
        drop=True
    )

    # x座標で牌ごとの間隔を出し最も間が開いている位置を見つける
    # = 鳴きの判別
    div = pai_det_data["xmax"].diff().idxmax()
    if div == 13:
        div = 14

    # 手牌のうち鳴いていない部分
    bingpai_l: list[str] = pai_det_data[:div]["name"].tolist()
    bingpai: str = ""
    for i in range(len(bingpai_l)):
        bingpai += bingpai_l[i]

    # 手牌のうち鳴いている部分
    fulou_l: list[str] = pai_det_data[div:]["name"].tolist()
    fulou: b_op.fulou_type = b_op.naki_paser(fulou_l)

    # 手牌全て
    tiles: str = ""
    tiles += bingpai
    for i in fulou:
        for j in i:
            tiles += j

    # bingpai "3s4s0s6p7p8p2s2s"
    # win_tile "2s"
    # fulou ([], ['6s7s8s'], [], ['1z1z1z1z'])
    # tiles "3s4s0s6p7p8p2s2s1z1z1z1z6s7s8s"

    test_dict = dict(
        {"bingpai": bingpai, "win_tile": bingpai_l[-1], "fulou": fulou, "tiles": tiles}
    )

    return test_dict
