import itertools

fulou_type = tuple[list[str], list[str], list[str], list[str]]
det_result_type = tuple[str, str, fulou_type, str]


def pai_distance(s1: str, s2: str) -> int:
    # 同じ種類の牌がどのくらい離れているかを返す
    MUGEN = 100
    # 長さが2で無ければ無限
    if len(s1) != 2 or len(s2) != 2:
        return MUGEN

    # どちらかが字牌でも無限
    if s1[1] == "z" or s2[1] == "z":
        return MUGEN

    # 同じ種類で無ければ無限
    if s1[1] != s2[1]:
        return MUGEN

    n1 = int(s1[0])
    n2 = int(s2[0])

    return abs(n1 - n2)


def is_in_list_all_eq(es: list[str]) -> bool:
    return len(list(set(es))) == 1


def is_in_list_some_eq(es: list[str]) -> bool:
    return len(list(set(es))) != len(es)


def is_syuntu(l: list[str]) -> bool:
    # 3枚のリストを取って順子かどうかを返す
    if len(l) != 3:
        return False

    # 一枚でも字牌ならFalse
    for pai in l:
        if pai[1] == "z":
            return False

    # 1枚でも同じのがあればFalse
    if is_in_list_some_eq(l):
        return False

    # 牌の数字の距離が1, 1, 2でなければFalse
    num_dist_l = []
    for (i, j) in itertools.combinations(l, 2):
        num_dist_l.append(pai_distance(i, j))

    num_dist_l.sort()
    if num_dist_l != [1, 1, 2]:
        return False

    return True


def list_to_s(l: list[str]) -> str:
    # strのlistを全部くっつけて返す
    s = ""
    for t in l:
        s += t
    return s


def naki_paser(fulou_l: list[str]) -> fulou_type:
    # 鳴かれた牌から鳴きの種類を分別して返す
    loop_n: int = len(fulou_l) // 3
    n: int = len(fulou_l)

    pon: int = 0
    pon_l: list[str] = []
    chi: int = 0
    chi_l: list[str] = []
    ankan: int = 0
    ankan_l: list[str] = []
    minkan: int = 0
    minkan_l: list[str] = []

    for lcount in range(loop_n):
        # iは3枚or4枚を取り始める最初の位置
        i = lcount * 3 + ankan + minkan
        if n < i:
            break

        kari_fulou: list[str] = []
        for j in range(3):
            kari_fulou.append(fulou_l[i + j])

        # 3枚の中に裏面があればそれはアンカン
        if "back" in kari_fulou:
            ankan += 1
            continue

        # 3枚全て同じ要素なら
        if is_in_list_all_eq(kari_fulou):
            ponf: bool = True  # ポン確定
            kanf: bool = False
            # まだ牌があれば
            if i + 4 <= n:
                kari_fulou.append(fulou_l[i + 4 - 1])
                # 4枚同じ要素ならミンカン
                if is_in_list_all_eq(kari_fulou):
                    ponf = False
                    kanf = True
                    # さらにまだ牌があれば
                    if i + 5 <= n:
                        karikari: list[str] = []
                        for j in range(3):
                            karikari.append(fulou_l[i + 3 + j])
                            # 3枚が順子ならポンに確定
                            # 111123333mの時正しくパース
                            # 1111234444mの時向き情報がないと定まらない
                            if is_syuntu(karikari):
                                kanf = False
                                ponf = True

                kari_fulou.pop()  # 4枚目を削除

            if ponf:
                pon += 1
                pon_l.append(list_to_s(kari_fulou))

            if kanf:
                kari_fulou.append(fulou_l[i + 4 - 1])
                minkan += 1
                minkan_l.append(list_to_s(kari_fulou))

            continue

        if is_syuntu(kari_fulou):
            chi += 1
            chi_l.append(list_to_s(kari_fulou))
            continue

    return pon_l, chi_l, ankan_l, minkan_l
