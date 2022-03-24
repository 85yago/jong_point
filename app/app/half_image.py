import os
import sys

import cv2

args = sys.argv[1:]
save_path = "/halfed/"


def half_image(path):
    # 0: 正常終了

    img = cv2.imread(path)

    img_halfed = cv2.resize(img, dsize=None, fx=0.5, fy=0.5)

    # 保存先のdirの確認
    os.makedirs(os.path.split(path)[0] + save_path, exist_ok=True)

    new_path = (
        os.path.split(path)[0]
        + save_path
        + os.path.split(os.path.splitext(path)[0])[1]
        + "-halfed.png"
    )

    # print(new_path)

    cv2.imwrite(new_path, img_halfed)

    return new_path
