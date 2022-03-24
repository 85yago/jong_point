"use strict";

window.addEventListener("DOMContentLoaded", () => {
  update_paint(true);

  document
    .getElementById("send-img-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const display_process = document.getElementById("display-process");

      display_process.textContent = "処理中です";
      const formData = new FormData();
      const imgfield = document.querySelector("#tile");
      formData.append("uploaded_file", imgfield.files[0]);
      let is_succeeded = true;

      const tile_data = await return_tiles(formData).catch(
        () => (is_succeeded = false)
      );

      if (is_succeeded) {
        display_process.textContent = "処理完了";
        extract_tiles(tile_data);
      } else {
        display_process.textContent = "処理失敗";
      }
    });

  document
    .getElementById("tiles-and-situ-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const tiles_and_situ = get_tiles_and_situ_from_form();
      let is_succeeded = true;

      const result = await calc_hand(tiles_and_situ).catch(
        () => (is_succeeded = false)
      );

      if (is_succeeded) {
        paint_result(result);
      } else {
        // 何もしない
      }
    });

  document
    .getElementById("bingpai")
    .addEventListener("blur", () => update_paint());

  Array.prototype.forEach.call(
    document.getElementsByClassName("fulou-input"),
    (x) => x.addEventListener("blur", () => update_paint())
  );

  Array.prototype.forEach.call(
    document.getElementsByClassName("fulou-type-input"),
    (x) => x.addEventListener("change", () => update_paint())
  );
});

// jsonを受け取ってページに埋め込む関数
const extract_tiles = async (tile_data) => {
  // tile_data = JSON.parse('{"bingpai": "3s4s0s6p7p8p2s2s", "win_tile": "2s", "fulou": [[], ["6s7s8s"], ["1z1z1z1z"], []], "tiles": "3s4s0s6p7p8p2s2s6s7s8s1z1z1z1z"}');

  // 手牌
  document.getElementById("bingpai").value = await tile_data.bingpai;

  for (let i = 0; i < 4; i++) {
    document.getElementById("fulou" + i).value = "";
    document.getElementById("fulou" + i + "type").value = "none";
  }

  // 鳴き
  let fulou_counter = 0;
  for (let i = 0; i < 4; i++) {
    // console.log(tile_data.fulou[i]);
    for (let j = 0; j < tile_data.fulou[i].length; j++) {
      console.log(j);
      const naki = tile_data.fulou[i][j];
      // console.log(naki);
      document.getElementById("fulou" + fulou_counter).value = naki;
      let naki_type = "none";

      switch (i) {
        case 0:
          naki_type = "pon";
          break;

        case 1:
          naki_type = "chi";
          break;

        case 2:
          naki_type = "ankan";
          break;

        case 3:
          naki_type = "minkan";
          break;

        default:
          break;
      }

      document.getElementById("fulou" + fulou_counter + "type").value =
        naki_type;

      fulou_counter++;
    }
  }

  update_paint();
};

const get_tiles_and_situ_from_form = () => {
  // TODO: 手と状況、計算結果の形を決める
  const tileandsitu_input = document.forms["tiles-and-situ-form"];

  let tiles_and_situ = {
    bingpai: tileandsitu_input.elements["bingpai"].value,

    fulou: [
      tileandsitu_input.elements["fulou0"].value,
      tileandsitu_input.elements["fulou1"].value,
      tileandsitu_input.elements["fulou2"].value,
      tileandsitu_input.elements["fulou3"].value,
    ],

    fulou_type: [
      tileandsitu_input.elements["fulou0type"].value,
      tileandsitu_input.elements["fulou1type"].value,
      tileandsitu_input.elements["fulou2type"].value,
      tileandsitu_input.elements["fulou3type"].value,
    ],

    dora: [
      tileandsitu_input.elements["dora0"].value,
      tileandsitu_input.elements["dora1"].value,
      tileandsitu_input.elements["dora2"].value,
      tileandsitu_input.elements["dora3"].value,
      tileandsitu_input.elements["dora4"].value,
      tileandsitu_input.elements["dora5"].value,
      tileandsitu_input.elements["dora6"].value,
      tileandsitu_input.elements["dora7"].value,
      tileandsitu_input.elements["dora8"].value,
      tileandsitu_input.elements["dora9"].value,
    ],

    agari: "tumo",

    zikaze: tileandsitu_input.elements["zikaze"].value,
    bakaze: tileandsitu_input.elements["bakaze"].value,

    riiti: tileandsitu_input.elements["riiti"].value,

    ippatu: "true",

    krt: tileandsitu_input.elements["krt"].value,

    tenhou: tileandsitu_input.elements["tenhou"].value,
  };

  if (document.querySelector("#tumo").checked) {
    tiles_and_situ.agari = "tumo";
  } else {
    tiles_and_situ.agari = "ron";
  }

  if (tileandsitu_input.elements["ippatu"].checked) {
    tiles_and_situ.ippatu = "true";
  } else {
    tiles_and_situ.ippatu = "false";
  }

  return tiles_and_situ;
};

const paint_result = (result) => {
  // result = {
  //     "han": 3,
  //     "fu": 40,
  //     "cost": {
  //         "main": 2600,
  //         "main_bonus": 0,
  //         "additional": 2600,
  //         "additional_bonus": 0,
  //         "kyoutaku_bonus": 0,
  //         "total": 7800,
  //         "yaku_level": ""
  //     },
  //     "yaku": "[Yakuhai (wind of place), Yakuhai (wind of round), Aka Dora 1]",
  //     "fu_details": [
  //         { "fu": 20, "reason": "base" },
  //         { "fu": 16, "reason": "open_terminal_kan" },
  //         { "fu": 2, "reason": "pair_wait" },
  //         { "fu": 2, "reason": "tsumo" }
  //     ]
  // };

  console.log(result);
  const resultdiv = document.getElementById("results-section");
  resultdiv.style.display = "block";

  let han = document.querySelector("#hanfu");
  let ten = document.querySelector("#ten");
  let ten_dist = document.querySelector("#ten-distribution");
  let yaku = document.querySelector("#result-detail");

  while (yaku.lastChild) {
    yaku.removeChild(yaku.lastChild);
  }

  if (result.cost) {
    if (result.han < 13) {
      han.textContent = result.han + "飜" + result.fu + "符";
    } else {
      han.textContent =
        (Math.floor(result.han / 13) == 1
          ? ""
          : Math.floor(result.han / 13) + "倍") + "役満";
    }

    ten.textContent = result.cost.total + "点";
    if (result.cost.main == result.cost.additional) {
      // main と additional が等しいとき、～点オール（親のツモ）
      ten_dist.textContent = result.cost.main + "点オール";
    } else if (result.cost.additional != 0) {
      // main と additional が異なっており、かつ、addition が0でないとき、～点, ～点（子のツモ）
      ten_dist.textContent =
        result.cost.main + "点, " + result.cost.additional + "点";
    } else {
      // additional がゼロの時（ロン上がり）
      ten_dist.textContent = result.cost.main + "点";
    }
  } else {
    han.textContent = "役が成立していません";
    ten.textContent = "-";
    ten_dist.textContent = "-";
  }

  const eltr = document.createElement("tr");
  const eltd = document.createElement("th");
  eltd.textContent = "詳細";
  eltr.appendChild(eltd);
  yaku.appendChild(eltr);

  const eltr1 = document.createElement("tr");
  const eltd1 = document.createElement("th");
  eltd1.textContent = "役一覧";
  eltr1.appendChild(eltd1);
  yaku.appendChild(eltr1);

  const yakulist = result.yaku.replace("[", "").replace("]", "").split(", ");
  for (let i = 0; i < yakulist.length; i++) {
    const eltrx = document.createElement("tr");
    const eltdx = document.createElement("td");
    eltrx.colspan = 2;
    eltdx.textContent = yakulist[i];
    eltrx.appendChild(eltdx);
    yaku.appendChild(eltrx);
  }

  const eltr2 = document.createElement("tr");
  const eltd2 = document.createElement("th");
  eltd2.textContent = "符一覧";
  eltr2.appendChild(eltd2);
  yaku.appendChild(eltr2);

  let fu_sum = 0;
  /*result.fu_details.forEach(e => {
        fu_details.innerHTML += '<div>' + e.reason + ': ' + e.fu + '</div>';
        fu_sum += e.fu;
    });*/

  for (let i = 0; i < result.fu_details.length; i++) {
    const eltrx = document.createElement("tr");
    const eltdxx1 = document.createElement("td");
    eltdxx1.textContent = result.fu_details[i].reason;
    eltrx.appendChild(eltdxx1);

    const eltdxx2 = document.createElement("td");
    eltdxx2.textContent = result.fu_details[i].fu + "符";
    fu_sum += result.fu_details[i].fu;
    eltrx.appendChild(eltdxx2);
    yaku.appendChild(eltrx);
  }

  const eltr3 = document.createElement("tr");
  const eltd3 = document.createElement("th");
  eltd3.textContent = fu_sum + "符";
  eltr3.appendChild(eltd3);
  yaku.appendChild(eltr3);
};

const update_paint = (is_first) => {
  paint_tiles();

  if (!is_first) {
    paint_error();
  }
};

const paint_tiles = () => {
  let tile_elem = document.getElementById("img-hand-tiles");

  while (tile_elem.lastChild) {
    tile_elem.removeChild(tile_elem.lastChild);
  }

  let elem_tiles = element_tiles(get_tiles_and_situ_from_form());
  if (elem_tiles) {
    tile_elem.appendChild(elem_tiles);
  }
};

const paint_error = () => {
  const bingpai_elem = document.getElementById("display-error-bingpai");
  while (bingpai_elem.lastChild) {
    bingpai_elem.removeChild(bingpai_elem.lastChild);
  }

  const elems = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    const elem = document.getElementById("display-error-fulou" + i);
    while (elem.lastChild) {
      elem.removeChild(elem.lastChild);
    }
    elems[i] = elem;
  }

  const error = error_check_hand(get_tiles_and_situ_from_form());
  for (let i = 0; i < error.length; i++) {
    if (error[i] != "success") {
      const error_msg = error[i].replace(/[0-3]/, "");
      let fulou_index = error[i].match(/[0-3]/);
      fulou_index = fulou_index ? fulou_index : "";
      console.log(fulou_index + error[i]);

      if (fulou_index) {
        elems[Number(fulou_index)].appendChild(
          element_fulou_caution(error_msg)
        );
      } else {
        bingpai_elem.appendChild(element_bingpai_caution(error_msg));
      }
    }
  }
};

const convert_for_calc_hand = (tiles_and_situ) => {
  const tileandsitu_input = document.forms["tiles-and-situ-form"];

  return (tiles_and_situ = {
    bingpai: tiles_and_situ.bingpai,

    fulou0: tiles_and_situ.fulou[0],
    fulou1: tiles_and_situ.fulou[1],
    fulou2: tiles_and_situ.fulou[2],
    fulou3: tiles_and_situ.fulou[3],

    fulou0type: tiles_and_situ.fulou_type[0],
    fulou1type: tiles_and_situ.fulou_type[1],
    fulou2type: tiles_and_situ.fulou_type[2],
    fulou3type: tiles_and_situ.fulou_type[3],

    dora0: tiles_and_situ.dora[0],
    dora1: tiles_and_situ.dora[1],
    dora2: tiles_and_situ.dora[2],
    dora3: tiles_and_situ.dora[3],
    dora4: tiles_and_situ.dora[4],
    dora5: tiles_and_situ.dora[5],
    dora6: tiles_and_situ.dora[6],
    dora7: tiles_and_situ.dora[7],
    dora8: tiles_and_situ.dora[8],
    dora9: tiles_and_situ.dora[9],

    agari: tiles_and_situ.agari,

    zikaze: tiles_and_situ.zikaze,
    bakaze: tiles_and_situ.bakaze,

    riiti: tiles_and_situ.riiti,

    ippatu: tiles_and_situ.ippatu,

    krt: tiles_and_situ.krt,

    tenhou: tiles_and_situ.tenhou,
  });
};

// 入力をまとめて受け取って役の計算をする
const calc_hand = async (tiles_and_situ) => {
  const calc_result = await fetch("/api/calc", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(convert_for_calc_hand(tiles_and_situ)),
  });

  const ret = await calc_result.json();

  // {"han": 3, "fu": 40, "cost": {"main": 2600, "main_bonus": 0, "additional": 2600, "additional_bonus": 0, "kyoutaku_bonus": 0, "total": 7800, "yaku_level": ""}, "yaku": "[Yakuhai (wind of place), Yakuhai (wind of round), Aka Dora 1]", "fu_details": [{"fu": 20, "reason": "base"}, {"fu": 16, "reason": "open_terminal_kan"}, {"fu": 2, "reason": "pair_wait"}, {"fu": 2, "reason": "tsumo"}]}

  return ret;
};

// 画像を送信して牌の認識結果を受け取る
const return_tiles = async (form_data) => {
  const tilejson = await fetch("/api/detect", {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: form_data,
  });

  const ret_tiles = await tilejson.json();
  console.log(ret_tiles);

  return ret_tiles;
};

//ここから下はDOMの操作はしない(HTMLelementはつくる)
const split_and_valid_hand = (hand) => {
  if (!hand) {
    return;
  }

  const pais = hand.match(/.{1,2}/g);

  const regex = /[0-9][pms]|[1-7]z/;

  for (let i = 0; i < pais.length; i++) {
    if (!regex.test(pais[i])) {
      return;
    }
  }

  return pais;
};

const split_and_valid_fulou = (fulou_hand, fulou_type) => {
  if (fulou_type == "none") {
    return {
      result: "success",
      content: [],
    };
  }

  const pais = split_and_valid_hand(fulou_hand);
  if (!pais) {
    return {
      result: "format_error",
    };
  }

  if (fulou_type == "pon") {
    if (pais.length === 3) {
      if (pais[0] === pais[1] && pais[1] === pais[2]) {
        return {
          result: "success",
          content: pais,
        };
      } else {
        return {
          result: "not_right",
        };
      }
    } else {
      return {
        result: "num_error",
      };
    }
  }

  if (fulou_type == "chi") {
    if (pais.length === 3) {
      pais.sort();
      const cond1 = pais.reduce((acc, x) => acc && x.charAt(1) !== "z", true);
      const cond2 = pais.reduce(
        (acc, x, index) =>
          acc && Number(x.charAt(0)) === Number(pais[0].charAt(0)) + index,
        true
      );
      if (cond1 && cond2) {
        return {
          result: "success",
          content: pais,
        };
      } else {
        return {
          result: "not_right",
        };
      }
    } else {
      return {
        result: "num_error",
      };
    }
  } else if (fulou_type == "ankan" || fulou_type == "minkan") {
    if (pais.length == 4) {
      if (pais[0] === pais[1] && pais[1] === pais[2] && pais[2] === pais[3]) {
        return {
          result: "success",
          content: pais,
        };
      } else {
        return {
          result: "not_right",
        };
      }
    } else {
      return {
        result: "num_error",
      };
    }
  }

  return;
};

const canwin = (result) => {
  if (result["cost"]) {
    return true;
  } else {
    return false;
  }
};

const error_check_hand = (tiles_and_situ) => {
  const error = [];

  const bingpai = tiles_and_situ["bingpai"];
  const fulou = tiles_and_situ["fulou"];
  const fulou_type = tiles_and_situ["fulou_type"];

  let num_tiles = 0;

  if (split_and_valid_hand(bingpai)) {
    num_tiles += split_and_valid_hand(bingpai).length;
  } else {
    error.push("bingpai_format_error");
  }

  for (let i = 0; i < 4; i++) {
    if (fulou_type[i] !== "none") {
      const split_fulou = split_and_valid_fulou(fulou[i], fulou_type[i]);
      if (split_fulou.result === "success") {
        num_tiles += 3;
      } else {
        error.push(split_fulou.result + i);
      }
    }
  }

  if (error.length === 0 && num_tiles !== 14) {
    error.push("total_tiles_error");
  }

  if (error.length === 0) {
    error.push("success");
  }

  return error;
};

const element_tiles = (tiles_and_situ) => {
  //描画されている牌の消去
  const tile_elem = document.createElement("div");

  //手牌を読み込む
  const bingpai = tiles_and_situ["bingpai"];
  const pais = split_and_valid_hand(bingpai);
  if (!pais) {
    return;
  }

  //アガリ牌以外を描画
  const bingdiv = document.createElement("span");
  bingdiv.classList.add("bingpai-division");
  for (let i = 0; i < pais.length - 1; i++) {
    bingdiv.appendChild(element_tile_image(pais[i]));
  }
  tile_elem.appendChild(bingdiv);

  //アガリ牌を描画
  const windiv = document.createElement("span");
  windiv.classList.add("wintile-division");
  windiv.appendChild(element_tile_image(pais[pais.length - 1]));
  tile_elem.appendChild(windiv);

  //鳴いた牌を描画
  for (let i = 0; i < 4; i++) {
    const fulou = tiles_and_situ["fulou"][i];
    const fulou_type = tiles_and_situ["fulou_type"][i];
    const pais = split_and_valid_fulou(fulou, fulou_type);

    if (pais.result === "success") {
      tile_elem.appendChild(element_fulou_tiles(pais.content, fulou_type));
    }
  }
  return tile_elem;
};

const pai_dict = {
  "0m":"🀋",
  "0s":"🀔",
  "0p":"🀝",
  "1z":"🀀",
  "2z":"🀁",
  "3z":"🀂",
  "4z":"🀃",
  "5z":"🀆",
  "6z":"🀅",
  "7z":"🀄",
  "1m":"🀇",
  "2m":"🀈",
  "3m":"🀉",
  "4m":"🀊",
  "5m":"🀋",
  "6m":"🀌",
  "7m":"🀍",
  "8m":"🀎",
  "9m":"🀏",
  "1s":"🀐",
  "2s":"🀑",
  "3s":"🀒",
  "4s":"🀓",
  "5s":"🀔",
  "6s":"🀕",
  "7s":"🀖",
  "8s":"🀗",
  "9s":"🀘",
  "1p":"🀙",
  "2p":"🀚",
  "3p":"🀛",
  "4p":"🀜",
  "5p":"🀝",
  "6p":"🀞",
  "7p":"🀟",
  "8p":"🀠",
  "9p":"🀡",
  "back":"🀫"};

const element_tile_image = (tile_name, direction) => {
  const pai = document.createElement("span");

  pai.innerHTML = pai_dict[tile_name];
  if (tile_name == "0m" || tile_name == "0s" || tile_name == "0p") {
    pai.className = "aka-pai-font";
  }else{
    pai.className = "pai-font";
  }
  

  if (direction == "laid") {
    pai.classList.add("laid");
  }
  if (direction == "reversed") {
    pai.classList.add("reversed");
  }

  return pai;
};

const element_bingpai_caution = (msg) => {
  console.log(msg + "pp");
  let str = "0";
  if (msg === "bingpai_format_error") {
    str = "書式が間違ってます。";
  } else if (msg === "total_tiles_error") {
    str = "枚数が間違っています。";
  } else {
    str = "?";
  }

  const elem = document.createElement("div");
  elem.innerHTML = str;

  return elem;
};

const element_fulou_caution = (msg) => {
  let str = "0";
  if (msg === "format_error") {
    str = "書式が間違ってます。";
  } else if (msg === "num_error") {
    str = "枚数が間違っています。";
  } else if (msg === "not_right") {
    str = "面子の種類にあっていません";
  } else {
    str = "?";
  }

  const elem = document.createElement("div");
  elem.innerHTML = str;

  return elem;
};

const element_fulou_tiles = (fulou_tiles, fulou_type) => {
  const fuloudiv = document.createElement("span");
  fuloudiv.classList.add("fulou-division");

  if (fulou_type == "pon") {
    fuloudiv.appendChild(element_tile_image(fulou_tiles[0]));
    fuloudiv.appendChild(element_tile_image(fulou_tiles[1], "laid"));
    fuloudiv.appendChild(element_tile_image(fulou_tiles[2]));
  } else if (fulou_type == "chi") {
    fuloudiv.appendChild(element_tile_image(fulou_tiles[0], "laid"));
    fuloudiv.appendChild(element_tile_image(fulou_tiles[1]));
    fuloudiv.appendChild(element_tile_image(fulou_tiles[2]));
  } else if (fulou_type == "minkan") {
    fuloudiv.appendChild(element_tile_image(fulou_tiles[0], "laid"));
    fuloudiv.appendChild(element_tile_image(fulou_tiles[1]));
    fuloudiv.appendChild(element_tile_image(fulou_tiles[2]));
    fuloudiv.appendChild(element_tile_image(fulou_tiles[3]));
  } else if (fulou_type == "ankan") {
    fuloudiv.appendChild(element_tile_image("back"));
    fuloudiv.appendChild(element_tile_image(fulou_tiles[1]));
    fuloudiv.appendChild(element_tile_image(fulou_tiles[2]));
    fuloudiv.appendChild(element_tile_image("back"));
  }

  return fuloudiv;
};
