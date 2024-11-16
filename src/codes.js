// @ts-check

/**
 * For ppsspp hooking of ULUS10566 version of Dissidia 012
 * 
 * File name
 * 
 * Address: 0x08871288
 * Log format: {a0:s}
 * 
 * File hash (in big endian hex)
 * 
 * Address:0x08871428
 * Log format: {v0}
 * 
 * Below is a list of characeter codes the game uses and common file extensions.
 */

/**
 * two letter character and series codes.
 */
const name_2 = [
    "wo",     // Wol
    "ga",     // Garland
    "fn",     // Firion
    "em",     // Emperor
    "on",     // Onion
    "cd",     // Cod
    "ce",     // Cecil
    "ca",     // Kain
    "gb",     // Golbez
    "bu",     // Bartz
    "ed",     // Exdeath
    "gi",     // Gilgamesh
    "ti",     // Terra
    "cf",     // Kefka
    "cl",     // Cloud
    "tf",     // Tifa
    "ae",     // ? Aerith
    "sf",     // Sephiroth
    "sq",     // Squall
    "la",     // Laguna
    "am",     // Ultimeica
    "zi",     // Zidane
    "kj",     // Kuja
    "td",     // Tidus
    "yu",     // Yuna
    "je",     // Jecht
    "sh",     // Shantotto
    "pr",     // Prishe
    "va",     // Vaan
    "li",     // Lightning
    "gs",     // Gabranth
    "co",     // Cosmos
    "ch",     // Faral Chaos
    "na",     // Narriator

    "on",     // FFI
    "tw",     // FFII
    "th",     // FFIII
    "fo",     // FFIV
    "fi",     // FFV
    "si",     // FFVI
    "se",     // FFVII
    "eh",     // FFVIII
    "ni",     // FFIX
    "te",     // FFX
    "gs",     // Guest
    "or",     // Dissidia Original
];

/**
 * three letter character codes.
 */
const name_3 = [
    "one",    // FFI
    "two",    // FFII
    "thr",    // FFIII
    "for",    // FFIV
    "fiv",    // FFV
    "six",    // FFVI
    "sev",    // FFVII
    "eht",    // FFVIII
    "nin",    // FFIX
    "ten",    // FFX
    "gst",    // Guest
    "org"     // Dissidia Original
];

/**
 * 5 letter character codes for common files.
 */
const name_5 = [
    "on100",  // Wol
    "on200",  // Garland
    "tw100",  // Firion
    "tw200",  // Emperor
    "th100",  // Onion
    "th200",  // Cod
    "fo100",  // Cecil
    "fo110",  // Kain
    "fo200",  // Golbez
    "fi100",  // Bartz
    "fi200",  // Exdeath
    "fi210",  // Gilgamesh
    "si100",  // Terra
    "si200",  // Kefka
    "se100",  // Cloud
    "se110",  // Tifa
    "se120",  // Aerith
    "se200",  // Sephiroth
    "eh100",  // Squall
    "eh110",  // Laguna
    "eh200",  // Ultimeica
    "ni100",  // Zidane
    "ni200",  // Kuja
    "te100",  // Tidus
    "te110",  // Yuna
    "te200",  // Jecht
    "gs100",  // Shantotto
    "gs110",  // Prishe
    "gs120",  // Vaan
    "gs130",  // Lightning
    "gs200",  // Gabranth
    "or100",  // Cosmos
    "or700",  // Shinryu
    "or800",  // Mog
    "or200",  // Chaos
    "or210",  // Faral Chaos
];

/**
 * Full character codes for common files.
 */
const name_6 = [
    "one100", // Wol
    "one200", // Garland
    "two100", // Firion
    "two200", // Emperor
    "thr100", // Onion
    "thr200", // Cod
    "for100", // Cecil
    "for110", // Kain
    "for200", // Golbez
    "fiv100", // Bartz
    "fiv200", // Exdeath
    "fiv210", // Gilgamesh
    "six100", // Terra
    "six200", // Kefka
    "sev100", // Cloud
    "sev110", // Tifa
    "sev120", // Aerith
    "sev200", // Sephiroth
    "eht100", // Squall
    "eht110", // Laguna
    "eht200", // Ultimeica
    "nin100", // Zidane
    "nin200", // Kuja
    "ten100", // Tidus
    "ten110", // Yuna
    "ten200", // Jecht
    "gst100", // Shantotto
    "gst110", // Prishe
    "gst120", // Vaan
    "gst130", // Lightning
    "gst200", // Gabranth
    "org100", // Cosmos
    "org700", // Shinryu
    "org800", // Mog
    "org200", // Chaos
    "org210", // Faral Chaos
];

/**
 * Extensions for different file types based of of magic guess.
 */
const exts = {
    "RIFF":        "at3",
    "ARC\u0001":   "objx",
    "MPK ":        "mpk",
    "OMG.":        "gmo",
    "DES4":        "id",
    "PSF":         "sfo",
    "MIG.":        "gim",
    "\u0002":      "exex", // can also be .se
    "\u0004":      "se",
    "\u0001":      "cosx",
    "SSCF":        "scd",
    "�PNG":       "png",
    "TIM2":        "tm2",
    "SEQ ":        "sequence",
    //"mlng":        "sequence", // can be sequence or bin
    "drr":         "drr",
    "dec":         "dec",
    "dur":         "dur",
    "due":         "due",
    "dpr":         "dpr",
    "EXsW":        "txt",
    "dpc":         "dpc",

    "LRWD":        "bin",
    "mess":        "bin",
    "menu":        "bin",
    "VOLD":        "bin",
    "�\u0001":    "bin",
    "�\u0002":    "bin",
    "ef":          "bin",
    "\u0005":      "bin",
    "\u0006":      "bin",
    "PBTL":        "bin",
    "TPMC":        "bin",
    "\u0002\t":    "bin",
    "ACMD":        "bin",
    "\u0001!":     "bin",
    "SMSC":        "bin",
    "SRSC":        "bin",
    "CLSM":        "bin",
    "\u0004u":     "bin",
    "SRMC":        "bin",
    "SDCV":        "bin", // save_data_convert
 
    "WLCN":        "data", // unknown
    "P\u0002":     "data", // unknown
    "\u0005\u0001":"data", // unknown
    "\u0001\u0002":"data", // unknown
    "KPSH":        "data", // unknown
    "��":        "data", // unknown
    "\u0016\u0017":"data", // unknown
    "":            "data", // blank file
};

module.exports = {
    name_2,
    name_3,
    name_5,
    name_6,

    exts
};