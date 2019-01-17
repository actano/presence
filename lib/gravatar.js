import md5 from 'md5'
import _urlify from 'urlify'

export const urlify = _urlify.create({
  addEToUmlauts: true,
  szToSs: true,
  spaces: '.',
  nonPrintable: '_',
  trim: true,
})

export default function (gravatarPrefix, emailSuffix, name) {
  const hash = md5(`${name}${emailSuffix}`)
  return `${gravatarPrefix}${hash}`
}
