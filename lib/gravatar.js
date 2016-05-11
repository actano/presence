import md5 from 'MD5'
import _urlify from 'urlify'

const urlify = _urlify.create({
    addEToUmlauts: true,
    szToSs: true,
    spaces: ".",
    nonPrintable: "_",
    trim: true
});

export default function(gravatarPrefix, emailSuffix, name){
    let name_md5 = md5(`${urlify(name.toLowerCase())}${emailSuffix}`);
    return `${gravatarPrefix}${name_md5}`;
}