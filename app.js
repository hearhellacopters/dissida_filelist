// @ts-check
const pack = require('./package.json');
const fs = require('fs');
const path = require('path');
const { 
    Logger,
    C_HEX,
    PROGRAM,
    DIR_NAME,
    exit,
    ask,
} = require('./src/common.js');
const { 
    generateReplacements,
    hash,
    to4ByteHex,
    hasPlaceholders,
    _MAKE_PACKAGE_INFO,
    _EXTRACT_PACKAGE_DATA,
    _MAKE_PACKAGE_INFO_BIN,
    check_name,
    read_text,
    _REPLACE_FILE,
    check_meta
} = require('./src/functions.js');


// Set commands to program for
PROGRAM
  .name('dissida_filelist')
  .description(`${C_HEX.blue}Dissidia 012 file list creator and unpacker${C_HEX.reset}`)
  .version(pack.version)

  .option('-p, --package_info <string>',   'Input path of PACKAGE_INFO.BIN file to create a fresh PACKAGE_INFO.json file.')

  .option('-m, --meta <string>',           'Reports meta data on found file names in list based on extension type.')

  .option(`-h, --hash <string>`,           `Input a single file path string to see if it matches any hashes. Will add any matching file paths to local PACKAGE_INFO.json file. Can also use wildcards characters for inserting character codes or numbers. See --help for details. Can also use a .txt file with --text for muliple entries.`)

  .option(`-t, --text <string>`,           `Batch version of --hash. Input a text file and it will hash each line for a file match.`)

  .option('-e, --enforce_ext',             `Enforce an ext check if the file name string doesn't match the file magics.`)
  
  .option(`-s, --sorted <string>`,         `Input path of PACKAGE_INFO.json file to create a sorted PACKAGE_INFO_sorted.json file, based off of the offset in the PACKAGE.BIN file.`)

  .option(`-x, --extract <string>`,        'Extracts all files from the input PACKAGE.BIN file.')

  .option(`-r, --replace <string>`,        'Replace a file in the PACKAGE.BIN file (with in limits). Input path of new file to add / replace in PACKAGE.BIN (name doesn\'t matter). Must use with --filename for PACKAGE_INFO.json filename entry match. PACKAGE.BIN and PACKAGE_INFO.json must be in root directory.')

  .option(`-f, --filename <string>`,       'Input path filename matching in PACKAGE_INFO.json of file being replacing in the PACKAGE.BIN file. PACKAGE.BIN and PACKAGE_INFO.json must be in root directory. Craetes new PACKAGE_INFO.BIN too.')

  .option(`-c, --compile <string>`,        'Compiles a new PACKAGE_INFO.BIN file based off of input PACKAGE_INFO.json. Created normally when using --replace.')

PROGRAM.addHelpText("after",`
${C_HEX.yellow}Note:${C_HEX.reset} The best way to find file names is by playing the ${C_HEX.blue}ULUS10566${C_HEX.reset} version of the game on a PPSSPP and hooking 0x08871288 with a log of {a0:s}. You can then use ${C_HEX.yellow}--hash='path/to/voice_eth100.dat'${C_HEX.reset} to see if there is any match. 
    
You can also use ${C_HEX.yellow}wildscards${C_HEX.reset} for character codes and increasing numbers. ${C_HEX.yellow}%2s${C_HEX.reset} and ${C_HEX.yellow}%3s${C_HEX.reset} adds 2 and 3 letter character codes (character and series codes), ${C_HEX.yellow}%5s${C_HEX.reset} and ${C_HEX.yellow}%6s${C_HEX.reset} for 5 and 6 letter character codes (inculdes numbers), and ${C_HEX.yellow}%1d to %5d${C_HEX.reset} numbers (0-9, 0-99 etc) like ${C_HEX.yellow}--hash='voice/sounds/battle_%3s1%1d0.at3'${C_HEX.reset} (example: ${C_HEX.yellow}voice/sounds/battle_sev120.at3${C_HEX.reset}). 

${C_HEX.red}WARNING:${C_HEX.reset} False positive as possible, so do use sparingly!`)
PROGRAM.parse(process.argv);

/**
 * Command line arguments.
 */
const ARGV = PROGRAM.opts();

const input_set = new Set([
    /^-p/,  /^--package_info/,
    /^-m/,  /^--meta/,
    /^-h/,  /^--hash/,
    /^-t/,  /^--text/,
    /^-e/,  /^--enforce_ext/,
    /^-s/,  /^--sorted/,
    /^-x/,  /^--extract/,
    /^-r/,  /^--replace/,
    /^-f/,  /^--filename/,
    /^-c/,  /^--compile/,
  ]);

/**
 * Filters out strings that match any regular expression in the provided set.
 *
 * @param {string[]} strings - An array of strings to be filtered.
 * @param {Set<RegExp>} regexSet - A set of regular expressions to test against the strings.
 * @returns {string[]} - An array of strings that do not match any of the regular expressions.
 */
function filterByRegex(strings, regexSet) {
    return strings.filter(str => ![...regexSet].some(regex => regex.test(str) ));
}
  
const _INPUT_FILE = filterByRegex(process.argv.slice(2), input_set)[0];

Logger.info(`Commands:`);
Logger.info(ARGV);
if(_INPUT_FILE != undefined){
    Logger.info(`File: ${C_HEX.yellow}${_INPUT_FILE}${C_HEX.reset}`);
};

// Starts app
(async function () {

    var has_package_bin = false;
    if(_INPUT_FILE && path.basename(_INPUT_FILE).toLocaleLowerCase() == "package.bin"){
        has_package_bin = true;
    }

    var has_package_info_bin = false;
    if(_INPUT_FILE && path.basename(_INPUT_FILE).toLocaleLowerCase() == "package_info.bin"){
        has_package_info_bin = true;
    }

    var has_package_info_json = false;
    if(_INPUT_FILE && path.extname(_INPUT_FILE).toLocaleLowerCase() == '.json'){
        has_package_info_json = true;
    }

    var has_txt_file = false;
    if(_INPUT_FILE && path.extname(_INPUT_FILE).toLocaleLowerCase() == '.txt'){
        has_txt_file = true;
    }

    if(ARGV.meta){
        const path = ARGV.meta && ARGV.meta.replace(/^=/,"");
        var PATH_TO_JSON = path.join(path);
        if(!fs.existsSync(PATH_TO_JSON)){
            Logger.error("Input PACKAGE_INFO.json not found.");
            Logger.error("Checking for PACKAGE_INFO.json in base directory.");
            PATH_TO_JSON = path.join(DIR_NAME, 'PACKAGE_INFO.json');
            if(!fs.existsSync(PATH_TO_JSON)){
                Logger.error("Could not find PACKAGE_INFO.json.");
                Logger.error(PATH_TO_JSON);
                await exit();
            }
        }
        try {
            const data = fs.readFileSync(PATH_TO_JSON);
            const info = JSON.parse(data.toString());
            await check_meta(info);
        } catch (error) {
            Logger.error("Issue reading PACKAGE_INFO.json data.");
            Logger.error(error);
            await exit();
        }
    } else
    if(ARGV.sorted){
        const sorted = ARGV.sorted && ARGV.sorted.replace(/^=/,"");
        var PATH_TO_JSON = sorted;
        if(!fs.existsSync(PATH_TO_JSON)){
            Logger.error("Input PACKAGE_INFO.json not found.");
            Logger.error("Checking for PACKAGE_INFO.json in base directory.");
            PATH_TO_JSON = path.join(DIR_NAME, 'PACKAGE_INFO.json');
            if(!fs.existsSync(PATH_TO_JSON)){
                Logger.error("Could not find PACKAGE_INFO.json.");
                Logger.error(PATH_TO_JSON);
                await exit();
            }
        }
        try {
            var PATH_TO_SORTED = path.join(path.dirname(PATH_TO_JSON),'PACKAGE_INFO_sorted.json');
            const data = fs.readFileSync(PATH_TO_JSON);
            const info = JSON.parse(data.toString());
            const sort = Object.values(info).sort((a,b)=>a.offset - b.offset);
            fs.writeFileSync(PATH_TO_SORTED, JSON.stringify(sort,null,4));
            Logger.info("Sorted data written to:");
            Logger.info(PATH_TO_SORTED);
            await exit();
        } catch (error) {
            Logger.error("Issue reading PACKAGE_INFO.json data.");
            Logger.error(error);
            await exit();
        }
    } else
    if(ARGV.replace && ARGV.filename){
        const {replace, filename} = ARGV;
        const PATH_TO_JSON = path.join(DIR_NAME, 'PACKAGE_INFO.json');
        if(!fs.existsSync(PATH_TO_JSON)){
            Logger.error("PACKAGE_INFO.json not in root directory.");
            Logger.error(PATH_TO_JSON);
            await exit();
        }
        const PATH_TO_DATA = path.join(DIR_NAME, 'PACKAGE.BIN');
        if(!fs.existsSync(PATH_TO_JSON)){
            Logger.error("PACKAGE.BIN not in root directory.");
            Logger.error(PATH_TO_DATA);
            await exit();
        }
        if(!fs.existsSync(replace)){
            Logger.error("Can not read replacement file.");
            Logger.error(replace);
            await exit();
        }
        try {
            const REPLACEMENT_DAT = fs.readFileSync(replace);
            Logger.info("Replacing file:", filename);
            await _REPLACE_FILE(PATH_TO_JSON, PATH_TO_DATA, REPLACEMENT_DAT, filename);
        } catch (error) {
            Logger.error("Issue replacing PACKAGE.BIN file.");
            Logger.error(error);
            await exit();
        }
    } else
    if(ARGV.text || has_txt_file){
        const TXT_INPUT = _INPUT_FILE || ARGV.text && ARGV.text.replace(/^=/,"");
        try {
            if(fs.existsSync(TXT_INPUT)){
                const PATH_TO_JSON = path.join(DIR_NAME, 'PACKAGE_INFO.json');
                if(!fs.existsSync(PATH_TO_JSON)){
                    Logger.error("PACKAGE_INFO.json not in root directory.");
                    Logger.error(PATH_TO_JSON);
                    await exit();
                }
                const JSON_DATA = JSON.parse(fs.readFileSync(PATH_TO_JSON).toString());
                await read_text(TXT_INPUT, JSON_DATA, PATH_TO_JSON);
            } else {
                Logger.error("File does not exist!");
                Logger.error(TXT_INPUT);
                await exit();
            }
        } catch (error) {
            Logger.error("Issue reading txt file.");
            Logger.error(error);
            await exit();
        }
    } else 
    if(ARGV.hash){
        const hash_str = ARGV.hash.replace(/^=/,"");
        try {
            const PATH_TO_JSON = path.join(DIR_NAME, 'PACKAGE_INFO.json');
            if(hasPlaceholders(hash_str) != null){
                if(fs.existsSync(PATH_TO_JSON)){
                    const JSON_DATA = JSON.parse(fs.readFileSync(PATH_TO_JSON).toString());
                    Logger.info("Wildscards detected!");
                    Logger.info("Creating an array of strings.");
                    Logger.info(`${C_HEX.yellow}Note${C_HEX.reset}: False positive as possible so use sparingly.`);
                    
                    const str_arays = generateReplacements(hash_str);
                    const len = str_arays.length;
                    var found = 0;
                    for (let i = 0; i < str_arays.length; i++) {
                        const str_path = str_arays[i];
                        const hash_num = hash(str_path);
                        Logger.info(`${C_HEX.yellow}[${i+1} of ${len}]${C_HEX.reset}: ${C_HEX.magenta}Path:${C_HEX.reset} ${C_HEX.yellow}${str_path}${C_HEX.reset}`);
                        Logger.info(`${C_HEX.yellow}[${i+1} of ${len}]${C_HEX.reset}: Number:`, hash_num);
                        Logger.info(`${C_HEX.yellow}[${i+1} of ${len}]${C_HEX.reset}: Hex:`, to4ByteHex(hash_num));
                        found += await check_name(JSON_DATA, hash_num, str_path, ARGV.enforce_ext);
                    }
                    Logger.info(`${C_HEX.green}Found ${found} matches!${C_HEX.reset}`);
                    fs.writeFileSync(PATH_TO_JSON, JSON.stringify(JSON_DATA,null,4));
                    if(found){
                        Logger.info("Updated PACKAGE_INFO.json file!");
                    }
                    const sorted = Object.values(JSON_DATA);
                    var found = 0;
                    for (let i = 0; i < sorted.length; i++) {
                        const el = sorted[i];
                        if(el.filename != ""){
                            found++;
                        }
                    }
                    console.log(`Filenames: ${found} / ${sorted.length}`);
                    await exit();
                } else {
                    Logger.error("Couldn't find local PACKAGE_INFO.json to save the data.");
                    Logger.error(PATH_TO_JSON);
                    await exit();
                }
            } else {
                const hash_num = hash(hash_str);
                Logger.info(`${C_HEX.magenta}Path:${C_HEX.reset}: ${C_HEX.yellow}${hash_str}${C_HEX.reset}`);
                Logger.info("Number:", hash_num);
                Logger.info("Hex:", to4ByteHex(hash_num));
                var found = 0;
                if(fs.existsSync(PATH_TO_JSON)){
                    const JSON_DATA = JSON.parse(fs.readFileSync(PATH_TO_JSON).toString());
                    found = await check_name(JSON_DATA, hash_num, hash_str, ARGV.enforce_ext);
                    if(found){
                        fs.writeFileSync(PATH_TO_JSON, JSON.stringify(JSON_DATA,null,4));
                        Logger.info("Updated PACKAGE_INFO.json file!");
                    } else {
                        Logger.info(`Nothing new found. No update to PACKAGE_INFO.json.`);
                    }
                    const sorted = Object.values(JSON_DATA);
                    var found = 0;
                    for (let i = 0; i < sorted.length; i++) {
                        const el = sorted[i];
                        if(el.filename != ""){
                            found++;
                        }
                    }
                    console.log(`Filenames: ${found} / ${sorted.length}`);
                    await exit();
                } else {
                    Logger.error("Couldn't find local PACKAGE_INFO.json to save the data.");
                    Logger.error(PATH_TO_JSON);
                    await exit();
                }
            }
        } catch (error) {
            Logger.error("Issue reading PACKAGE_INFO.json data.");
            Logger.error(error);
            await exit();
        }
    } else 
    if(ARGV.compile|| has_package_info_json){
        const package_json = _INPUT_FILE || ARGV.compile && ARGV.compile.replace(/^=/,"");
        try {
            Logger.info("PACKAGE_INFO.BIN creation triggered!");
            const answer = await ask("Do you want to create a new PACKAGE_INFO.BIN file?");
            if(answer){
                if(fs.existsSync(package_json)){
                    const PATH_TO_JSON = package_json;
                    await _MAKE_PACKAGE_INFO_BIN(PATH_TO_JSON);
                } else {
                    // trys for default location
                    Logger.warn("Couldn't find PACKAGE_INFO.json in input path.");
                    Logger.warn(package_json);
                    const PATH_TO_JSON = path.join(DIR_NAME, 'PACKAGE_INFO.json');
                    if(!fs.existsSync(PATH_TO_JSON)){
                        Logger.error("Could not find PACKAGE_INFO.json.");
                        Logger.error(PATH_TO_JSON);
                        await exit();
                    }
                    await _MAKE_PACKAGE_INFO_BIN(PATH_TO_JSON);
                }
            } else {
                Logger.warn("Cancelled creating PACKAGE_INFO.BIN.");
                await exit(); 
            }
        } catch (error) {
            Logger.error("Issue reading PACKAGE_INFO.json.");
            Logger.error(error);
            await exit();
        } 
    } else
    if (ARGV.package_info || has_package_info_bin) {
        const package_info = _INPUT_FILE || ARGV.package_info && ARGV.package_info.replace(/^=/,"");
        Logger.info("PACKAGE_INFO.json creation triggered!");
        try {
            // trys the input string as path
            if(fs.existsSync(package_info)){
                const PATH_TO_INFO = package_info;
                await _MAKE_PACKAGE_INFO(PATH_TO_INFO);
            } else {
                // trys for default location
                Logger.warn("Couldn't find PACKAGE_INFO.BIN in input path.");
                Logger.warn(package_info);
                Logger.warn("Falling back to execute directory.");
                const PATH_TO_INFO = path.join(DIR_NAME, 'PACKAGE_INFO.BIN');
                if(!fs.existsSync(PATH_TO_INFO)){
                    Logger.error("Could not find PACKAGE_INFO.BIN.");
                    Logger.error(PATH_TO_INFO);
                    await exit();
                }
                await _MAKE_PACKAGE_INFO(PATH_TO_INFO);
            }
        } catch (error) {
            Logger.error("Issue reading PACKAGE_INFO.BIN.");
            Logger.error(error);
            await exit();
        }
    } else 
    if(ARGV.extract || has_package_bin){
        const extract = _INPUT_FILE || ARGV.extract && ARGV.extract.replace(/^=/,"");
        // trys the input string as path
        Logger.info("PACKAGE.BIN extract triggered!");
        const answer = await ask("This will unpack all files in the directory of the PACKAGE.BIN file. Continue?");
        if(answer){
            try {
                if(fs.existsSync(extract)){
                    const PATH_TO_DATA = extract;
                    await _EXTRACT_PACKAGE_DATA(PATH_TO_DATA);
                } else {
                    // trys for default location
                    Logger.warn("Couldn't find PACKAGE.BIN in input path.");
                    Logger.warn(extract);
                    Logger.warn("Falling back to execute directory.");
                    const PATH_TO_DATA = path.join(DIR_NAME,"PACKAGE.BIN");
                    if(!fs.existsSync(PATH_TO_DATA)){
                        Logger.error("Could not find PACKAGE.BIN.");
                        Logger.error(PATH_TO_DATA);
                        await exit();
                    }
                    await _EXTRACT_PACKAGE_DATA(PATH_TO_DATA);
                }
            } catch (error){
                Logger.error("Issue extracting data.");
                Logger.error(error);
                await exit();
            }
        } else {
            Logger.info("Extract cancelled.");
            await exit();
        }
    } else {
        Logger.error("Didn't run anything. Try running the programming with --help to get started.");
        await exit();
    }
})();
