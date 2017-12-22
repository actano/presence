import md5 from 'md5'
import _urlify from 'urlify'

const urlify = _urlify.create({
  addEToUmlauts: true,
  szToSs: true,
  spaces: '.',
  nonPrintable: '_',
  trim: true,
})

export default function (gravatarPrefix, emailSuffix, name) {
  const hash = md5(`${urlify(name.toLowerCase())}${emailSuffix}`)
  return `${gravatarPrefix}${hash}`
}
