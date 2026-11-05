// Public WebP names from the private image ledger; unknown IDs are never inferred.
const CardImageResolver = (() => {
  // Change only this value to switch delivery. No credentials belong in this file.
  const source = 'worker'; // 'local' | 'worker'
  const workerBase = 'https://holodori-image-proxy.nikkinikky65.workers.dev/';
  if(!['local','worker'].includes(source)) throw new Error('Unknown card image source: '+source);
  function imageUrl(path){
    return source === 'local' ? path : workerBase + path.replace(/^assets\//, '');
  }
  const images = {
  "card-00001-5-uniq-0000-00": {
    "thin": "assets/cards/portrait/tokino-sora-r5-c001.webp",
    "thumb": "assets/cards/thumb/tokino-sora-r5-c001.webp",
    "full": "assets/cards/full/tokino-sora-r5-c001.webp"
  },
  "card-00002-5-uniq-0001-00": {
    "thin": "assets/cards/portrait/robocosan-r5-c001.webp",
    "thumb": "assets/cards/thumb/robocosan-r5-c001.webp",
    "full": "assets/cards/full/robocosan-r5-c001.webp"
  },
  "card-00004-5-uniq-0005-00": {
    "thin": "assets/cards/portrait/aki-rosenthal-r5-c001.webp",
    "thumb": "assets/cards/thumb/aki-rosenthal-r5-c001.webp",
    "full": "assets/cards/full/aki-rosenthal-r5-c001.webp"
  },
  "card-00004-5-uniq-0081-00": {
    "thin": "assets/cards/portrait/aki-rosenthal-r5-c002.webp",
    "thumb": "assets/cards/thumb/aki-rosenthal-r5-c002.webp",
    "full": "assets/cards/full/aki-rosenthal-r5-c002.webp"
  },
  "card-00005-5-uniq-0006-00": {
    "thin": "assets/cards/portrait/akai-haato-r5-c001.webp",
    "thumb": "assets/cards/thumb/akai-haato-r5-c001.webp",
    "full": "assets/cards/full/akai-haato-r5-c001.webp"
  },
  "card-00006-5-uniq-0007-00": {
    "thin": "assets/cards/portrait/shirakami-fubuki-r5-c001.webp",
    "thumb": "assets/cards/thumb/shirakami-fubuki-r5-c001.webp",
    "full": "assets/cards/full/shirakami-fubuki-r5-c001.webp"
  },
  "card-00006-5-uniq-0074-00": {
    "thin": "assets/cards/portrait/shirakami-fubuki-r5-c002.webp",
    "thumb": "assets/cards/thumb/shirakami-fubuki-r5-c002.webp",
    "full": "assets/cards/full/shirakami-fubuki-r5-c002.webp"
  },
  "card-00007-5-uniq-0008-00": {
    "thin": "assets/cards/portrait/natsuiro-matsuri-r5-c001.webp",
    "thumb": "assets/cards/thumb/natsuiro-matsuri-r5-c001.webp",
    "full": "assets/cards/full/natsuiro-matsuri-r5-c001.webp"
  },
  "card-00010-5-uniq-0010-00": {
    "thin": "assets/cards/portrait/nakiri-ayame-r5-c001.webp",
    "thumb": "assets/cards/thumb/nakiri-ayame-r5-c001.webp",
    "full": "assets/cards/full/nakiri-ayame-r5-c001.webp"
  },
  "card-00010-5-uniq-0069-00": {
    "thin": "assets/cards/portrait/nakiri-ayame-r5-c002.webp",
    "thumb": "assets/cards/thumb/nakiri-ayame-r5-c002.webp",
    "full": "assets/cards/full/nakiri-ayame-r5-c002.webp"
  },
  "card-00011-5-uniq-0011-00": {
    "thin": "assets/cards/portrait/yuzuki-choco-r5-c001.webp",
    "thumb": "assets/cards/thumb/yuzuki-choco-r5-c001.webp",
    "full": "assets/cards/full/yuzuki-choco-r5-c001.webp"
  },
  "card-00012-5-uniq-0012-00": {
    "thin": "assets/cards/portrait/oozora-subaru-r5-c001.webp",
    "thumb": "assets/cards/thumb/oozora-subaru-r5-c001.webp",
    "full": "assets/cards/full/oozora-subaru-r5-c001.webp"
  },
  "card-00012-5-uniq-0062-00": {
    "thin": "assets/cards/portrait/oozora-subaru-r5-c002.webp",
    "thumb": "assets/cards/thumb/oozora-subaru-r5-c002.webp",
    "full": "assets/cards/full/oozora-subaru-r5-c002.webp"
  },
  "card-00013-5-uniq-0002-00": {
    "thin": "assets/cards/portrait/azki-r5-c001.webp",
    "thumb": "assets/cards/thumb/azki-r5-c001.webp",
    "full": "assets/cards/full/azki-r5-c001.webp"
  },
  "card-00014-5-uniq-0013-00": {
    "thin": "assets/cards/portrait/ookami-mio-r5-c001.webp",
    "thumb": "assets/cards/thumb/ookami-mio-r5-c001.webp",
    "full": "assets/cards/full/ookami-mio-r5-c001.webp"
  },
  "card-00014-5-uniq-0075-00": {
    "thin": "assets/cards/portrait/ookami-mio-r5-c002.webp",
    "thumb": "assets/cards/thumb/ookami-mio-r5-c002.webp",
    "full": "assets/cards/full/ookami-mio-r5-c002.webp"
  },
  "card-00015-5-uniq-0003-00": {
    "thin": "assets/cards/portrait/sakura-miko-r5-c001.webp",
    "thumb": "assets/cards/thumb/sakura-miko-r5-c001.webp",
    "full": "assets/cards/full/sakura-miko-r5-c001.webp"
  },
  "card-00015-5-uniq-0067-00": {
    "thin": "assets/cards/portrait/sakura-miko-r5-c002.webp",
    "thumb": "assets/cards/thumb/sakura-miko-r5-c002.webp",
    "full": "assets/cards/full/sakura-miko-r5-c002.webp"
  },
  "card-00016-5-uniq-0014-00": {
    "thin": "assets/cards/portrait/nekomata-okayu-r5-c001.webp",
    "thumb": "assets/cards/thumb/nekomata-okayu-r5-c001.webp",
    "full": "assets/cards/full/nekomata-okayu-r5-c001.webp"
  },
  "card-00016-5-uniq-0076-00": {
    "thin": "assets/cards/portrait/nekomata-okayu-r5-c002.webp",
    "thumb": "assets/cards/thumb/nekomata-okayu-r5-c002.webp",
    "full": "assets/cards/full/nekomata-okayu-r5-c002.webp"
  },
  "card-00017-5-uniq-0015-00": {
    "thin": "assets/cards/portrait/inugami-korone-r5-c001.webp",
    "thumb": "assets/cards/thumb/inugami-korone-r5-c001.webp",
    "full": "assets/cards/full/inugami-korone-r5-c001.webp"
  },
  "card-00017-5-uniq-0077-00": {
    "thin": "assets/cards/portrait/inugami-korone-r5-c002.webp",
    "thumb": "assets/cards/thumb/inugami-korone-r5-c002.webp",
    "full": "assets/cards/full/inugami-korone-r5-c002.webp"
  },
  "card-00018-5-uniq-0004-00": {
    "thin": "assets/cards/portrait/hoshimachi-suisei-r5-c001.webp",
    "thumb": "assets/cards/thumb/hoshimachi-suisei-r5-c001.webp",
    "full": "assets/cards/full/hoshimachi-suisei-r5-c001.webp"
  },
  "card-00018-5-uniq-0068-00": {
    "thin": "assets/cards/portrait/hoshimachi-suisei-r5-c002.webp",
    "thumb": "assets/cards/thumb/hoshimachi-suisei-r5-c002.webp",
    "full": "assets/cards/full/hoshimachi-suisei-r5-c002.webp"
  },
  "card-00019-5-uniq-0016-00": {
    "thin": "assets/cards/portrait/usada-pekora-r5-c001.webp",
    "thumb": "assets/cards/thumb/usada-pekora-r5-c001.webp",
    "full": "assets/cards/full/usada-pekora-r5-c001.webp"
  },
  "card-00021-5-uniq-0017-00": {
    "thin": "assets/cards/portrait/shiranui-flare-r5-c001.webp",
    "thumb": "assets/cards/thumb/shiranui-flare-r5-c001.webp",
    "full": "assets/cards/full/shiranui-flare-r5-c001.webp"
  },
  "card-00021-5-uniq-0064-00": {
    "thin": "assets/cards/portrait/shiranui-flare-r5-c002.webp",
    "thumb": "assets/cards/thumb/shiranui-flare-r5-c002.webp",
    "full": "assets/cards/full/shiranui-flare-r5-c002.webp"
  },
  "card-00022-5-uniq-0018-00": {
    "thin": "assets/cards/portrait/shirogane-noel-r5-c001.webp",
    "thumb": "assets/cards/thumb/shirogane-noel-r5-c001.webp",
    "full": "assets/cards/full/shirogane-noel-r5-c001.webp"
  },
  "card-00022-5-uniq-0063-00": {
    "thin": "assets/cards/portrait/shirogane-noel-r5-c002.webp",
    "thumb": "assets/cards/thumb/shirogane-noel-r5-c002.webp",
    "full": "assets/cards/full/shirogane-noel-r5-c002.webp"
  },
  "card-00023-5-uniq-0019-00": {
    "thin": "assets/cards/portrait/houshou-marine-r5-c001.webp",
    "thumb": "assets/cards/thumb/houshou-marine-r5-c001.webp",
    "full": "assets/cards/full/houshou-marine-r5-c001.webp"
  },
  "card-00023-5-uniq-0085-00": {
    "thin": "assets/cards/portrait/houshou-marine-r5-c002.webp",
    "thumb": "assets/cards/thumb/houshou-marine-r5-c002.webp",
    "full": "assets/cards/full/houshou-marine-r5-c002.webp"
  },
  "card-00026-5-uniq-0021-00": {
    "thin": "assets/cards/portrait/tsunomaki-watame-r5-c001.webp",
    "thumb": "assets/cards/thumb/tsunomaki-watame-r5-c001.webp",
    "full": "assets/cards/full/tsunomaki-watame-r5-c001.webp"
  },
  "card-00026-5-uniq-0065-00": {
    "thin": "assets/cards/portrait/tsunomaki-watame-r5-c002.webp",
    "thumb": "assets/cards/thumb/tsunomaki-watame-r5-c002.webp",
    "full": "assets/cards/full/tsunomaki-watame-r5-c002.webp"
  },
  "card-00027-5-uniq-0022-00": {
    "thin": "assets/cards/portrait/tokoyami-towa-r5-c001.webp",
    "thumb": "assets/cards/thumb/tokoyami-towa-r5-c001.webp",
    "full": "assets/cards/full/tokoyami-towa-r5-c001.webp"
  },
  "card-00028-5-uniq-0023-00": {
    "thin": "assets/cards/portrait/himemori-luna-r5-c001.webp",
    "thumb": "assets/cards/thumb/himemori-luna-r5-c001.webp",
    "full": "assets/cards/full/himemori-luna-r5-c001.webp"
  },
  "card-00028-5-uniq-0070-00": {
    "thin": "assets/cards/portrait/himemori-luna-r5-c002.webp",
    "thumb": "assets/cards/thumb/himemori-luna-r5-c002.webp",
    "full": "assets/cards/full/himemori-luna-r5-c002.webp"
  },
  "card-00030-5-uniq-0024-00": {
    "thin": "assets/cards/portrait/yukihana-lamy-r5-c001.webp",
    "thumb": "assets/cards/thumb/yukihana-lamy-r5-c001.webp",
    "full": "assets/cards/full/yukihana-lamy-r5-c001.webp"
  },
  "card-00030-5-uniq-0089-00": {
    "thin": "assets/cards/portrait/yukihana-lamy-r5-c002.webp",
    "thumb": "assets/cards/thumb/yukihana-lamy-r5-c002.webp",
    "full": "assets/cards/full/yukihana-lamy-r5-c002.webp"
  },
  "card-00031-5-uniq-0025-00": {
    "thin": "assets/cards/portrait/momosuzu-nene-r5-c001.webp",
    "thumb": "assets/cards/thumb/momosuzu-nene-r5-c001.webp",
    "full": "assets/cards/full/momosuzu-nene-r5-c001.webp"
  },
  "card-00032-5-uniq-0026-00": {
    "thin": "assets/cards/portrait/shishiro-botan-r5-c001.webp",
    "thumb": "assets/cards/thumb/shishiro-botan-r5-c001.webp",
    "full": "assets/cards/full/shishiro-botan-r5-c001.webp"
  },
  "card-00034-5-uniq-0027-00": {
    "thin": "assets/cards/portrait/omaru-polka-r5-c001.webp",
    "thumb": "assets/cards/thumb/omaru-polka-r5-c001.webp",
    "full": "assets/cards/full/omaru-polka-r5-c001.webp"
  },
  "card-00034-5-uniq-0090-00": {
    "thin": "assets/cards/portrait/omaru-polka-r5-c002.webp",
    "thumb": "assets/cards/thumb/omaru-polka-r5-c002.webp",
    "full": "assets/cards/full/omaru-polka-r5-c002.webp"
  },
  "card-00035-5-uniq-0028-00": {
    "thin": "assets/cards/portrait/laplus-darknesss-r5-c001.webp",
    "thumb": "assets/cards/thumb/laplus-darknesss-r5-c001.webp",
    "full": "assets/cards/full/laplus-darknesss-r5-c001.webp"
  },
  "card-00035-5-uniq-0082-00": {
    "thin": "assets/cards/portrait/laplus-darknesss-r5-c002.webp",
    "thumb": "assets/cards/thumb/laplus-darknesss-r5-c002.webp",
    "full": "assets/cards/full/laplus-darknesss-r5-c002.webp"
  },
  "card-00036-5-uniq-0029-00": {
    "thin": "assets/cards/portrait/takane-lui-r5-c001.webp",
    "thumb": "assets/cards/thumb/takane-lui-r5-c001.webp",
    "full": "assets/cards/full/takane-lui-r5-c001.webp"
  },
  "card-00036-5-uniq-0078-00": {
    "thin": "assets/cards/portrait/takane-lui-r5-c002.webp",
    "thumb": "assets/cards/thumb/takane-lui-r5-c002.webp",
    "full": "assets/cards/full/takane-lui-r5-c002.webp"
  },
  "card-00037-5-uniq-0030-00": {
    "thin": "assets/cards/portrait/hakui-koyori-r5-c001.webp",
    "thumb": "assets/cards/thumb/hakui-koyori-r5-c001.webp",
    "full": "assets/cards/full/hakui-koyori-r5-c001.webp"
  },
  "card-00037-5-uniq-0086-00": {
    "thin": "assets/cards/portrait/hakui-koyori-r5-c002.webp",
    "thumb": "assets/cards/thumb/hakui-koyori-r5-c002.webp",
    "full": "assets/cards/full/hakui-koyori-r5-c002.webp"
  },
  "card-00039-5-uniq-0032-00": {
    "thin": "assets/cards/portrait/kazama-iroha-r5-c001.webp",
    "thumb": "assets/cards/thumb/kazama-iroha-r5-c001.webp",
    "full": "assets/cards/full/kazama-iroha-r5-c001.webp"
  },
  "card-03001-5-uniq-0033-00": {
    "thin": "assets/cards/portrait/ayunda-risu-r5-c001.webp",
    "thumb": "assets/cards/thumb/ayunda-risu-r5-c001.webp",
    "full": "assets/cards/full/ayunda-risu-r5-c001.webp"
  },
  "card-03002-5-uniq-0034-00": {
    "thin": "assets/cards/portrait/moona-hoshinova-r5-c001.webp",
    "thumb": "assets/cards/thumb/moona-hoshinova-r5-c001.webp",
    "full": "assets/cards/full/moona-hoshinova-r5-c001.webp"
  },
  "card-03003-5-uniq-0035-00": {
    "thin": "assets/cards/portrait/airani-iofifteen-r5-c001.webp",
    "thumb": "assets/cards/thumb/airani-iofifteen-r5-c001.webp",
    "full": "assets/cards/full/airani-iofifteen-r5-c001.webp"
  },
  "card-03004-5-uniq-0036-00": {
    "thin": "assets/cards/portrait/kureiji-ollie-r5-c001.webp",
    "thumb": "assets/cards/thumb/kureiji-ollie-r5-c001.webp",
    "full": "assets/cards/full/kureiji-ollie-r5-c001.webp"
  },
  "card-03004-5-uniq-0073-00": {
    "thin": "assets/cards/portrait/kureiji-ollie-r5-c002.webp",
    "thumb": "assets/cards/thumb/kureiji-ollie-r5-c002.webp",
    "full": "assets/cards/full/kureiji-ollie-r5-c002.webp"
  },
  "card-03005-5-uniq-0037-00": {
    "thin": "assets/cards/portrait/anya-melfissa-r5-c001.webp",
    "thumb": "assets/cards/thumb/anya-melfissa-r5-c001.webp",
    "full": "assets/cards/full/anya-melfissa-r5-c001.webp"
  },
  "card-03005-5-uniq-0084-00": {
    "thin": "assets/cards/portrait/anya-melfissa-r5-c002.webp",
    "thumb": "assets/cards/thumb/anya-melfissa-r5-c002.webp",
    "full": "assets/cards/full/anya-melfissa-r5-c002.webp"
  },
  "card-03006-5-uniq-0038-00": {
    "thin": "assets/cards/portrait/pavolia-reine-r5-c001.webp",
    "thumb": "assets/cards/thumb/pavolia-reine-r5-c001.webp",
    "full": "assets/cards/full/pavolia-reine-r5-c001.webp"
  },
  "card-03007-5-uniq-0039-00": {
    "thin": "assets/cards/portrait/vestia-zeta-r5-c001.webp",
    "thumb": "assets/cards/thumb/vestia-zeta-r5-c001.webp",
    "full": "assets/cards/full/vestia-zeta-r5-c001.webp"
  },
  "card-03008-5-uniq-0040-00": {
    "thin": "assets/cards/portrait/kaela-kovalskia-r5-c001.webp",
    "thumb": "assets/cards/thumb/kaela-kovalskia-r5-c001.webp",
    "full": "assets/cards/full/kaela-kovalskia-r5-c001.webp"
  },
  "card-03009-5-uniq-0041-00": {
    "thin": "assets/cards/portrait/kobo-kanaeru-r5-c001.webp",
    "thumb": "assets/cards/thumb/kobo-kanaeru-r5-c001.webp",
    "full": "assets/cards/full/kobo-kanaeru-r5-c001.webp"
  },
  "card-03009-5-uniq-0088-00": {
    "thin": "assets/cards/portrait/kobo-kanaeru-r5-c002.webp",
    "thumb": "assets/cards/thumb/kobo-kanaeru-r5-c002.webp",
    "full": "assets/cards/full/kobo-kanaeru-r5-c002.webp"
  },
  "card-04001-5-uniq-0042-00": {
    "thin": "assets/cards/portrait/mori-calliope-r5-c001.webp",
    "thumb": "assets/cards/thumb/mori-calliope-r5-c001.webp",
    "full": "assets/cards/full/mori-calliope-r5-c001.webp"
  },
  "card-04001-5-uniq-0071-00": {
    "thin": "assets/cards/portrait/mori-calliope-r5-c002.webp",
    "thumb": "assets/cards/thumb/mori-calliope-r5-c002.webp",
    "full": "assets/cards/full/mori-calliope-r5-c002.webp"
  },
  "card-04002-5-uniq-0043-00": {
    "thin": "assets/cards/portrait/takanashi-kiara-r5-c001.webp",
    "thumb": "assets/cards/thumb/takanashi-kiara-r5-c001.webp",
    "full": "assets/cards/full/takanashi-kiara-r5-c001.webp"
  },
  "card-04003-5-uniq-0044-00": {
    "thin": "assets/cards/portrait/ninomae-inanis-r5-c001.webp",
    "thumb": "assets/cards/thumb/ninomae-inanis-r5-c001.webp",
    "full": "assets/cards/full/ninomae-inanis-r5-c001.webp"
  },
  "card-04003-5-uniq-0072-00": {
    "thin": "assets/cards/portrait/ninomae-inanis-r5-c002.webp",
    "thumb": "assets/cards/thumb/ninomae-inanis-r5-c002.webp",
    "full": "assets/cards/full/ninomae-inanis-r5-c002.webp"
  },
  "card-04007-5-uniq-0047-00": {
    "thin": "assets/cards/portrait/irys-r5-c001.webp",
    "thumb": "assets/cards/thumb/irys-r5-c001.webp",
    "full": "assets/cards/full/irys-r5-c001.webp"
  },
  "card-04010-5-uniq-0049-00": {
    "thin": "assets/cards/portrait/ouro-kronii-r5-c001.webp",
    "thumb": "assets/cards/thumb/ouro-kronii-r5-c001.webp",
    "full": "assets/cards/full/ouro-kronii-r5-c001.webp"
  },
  "card-04012-5-uniq-0051-00": {
    "thin": "assets/cards/portrait/hakos-baelz-r5-c001.webp",
    "thumb": "assets/cards/thumb/hakos-baelz-r5-c001.webp",
    "full": "assets/cards/full/hakos-baelz-r5-c001.webp"
  },
  "card-04012-5-uniq-0087-00": {
    "thin": "assets/cards/portrait/hakos-baelz-r5-c002.webp",
    "thumb": "assets/cards/thumb/hakos-baelz-r5-c002.webp",
    "full": "assets/cards/full/hakos-baelz-r5-c002.webp"
  },
  "card-04013-5-uniq-0052-00": {
    "thin": "assets/cards/portrait/shiori-novella-r5-c001.webp",
    "thumb": "assets/cards/thumb/shiori-novella-r5-c001.webp",
    "full": "assets/cards/full/shiori-novella-r5-c001.webp"
  },
  "card-04013-5-uniq-0083-00": {
    "thin": "assets/cards/portrait/shiori-novella-r5-c002.webp",
    "thumb": "assets/cards/thumb/shiori-novella-r5-c002.webp",
    "full": "assets/cards/full/shiori-novella-r5-c002.webp"
  },
  "card-04014-5-uniq-0053-00": {
    "thin": "assets/cards/portrait/koseki-bijou-r5-c001.webp",
    "thumb": "assets/cards/thumb/koseki-bijou-r5-c001.webp",
    "full": "assets/cards/full/koseki-bijou-r5-c001.webp"
  },
  "card-04015-5-uniq-0054-00": {
    "thin": "assets/cards/portrait/nerissa-ravencroft-r5-c001.webp",
    "thumb": "assets/cards/thumb/nerissa-ravencroft-r5-c001.webp",
    "full": "assets/cards/full/nerissa-ravencroft-r5-c001.webp"
  },
  "card-04016-5-uniq-0055-00": {
    "thin": "assets/cards/portrait/fuwawa-abyssgard-r5-c001.webp",
    "thumb": "assets/cards/thumb/fuwawa-abyssgard-r5-c001.webp",
    "full": "assets/cards/full/fuwawa-abyssgard-r5-c001.webp"
  },
  "card-04016-5-uniq-0079-00": {
    "thin": "assets/cards/portrait/fuwawa-abyssgard-r5-c002.webp",
    "thumb": "assets/cards/thumb/fuwawa-abyssgard-r5-c002.webp",
    "full": "assets/cards/full/fuwawa-abyssgard-r5-c002.webp"
  },
  "card-04017-5-uniq-0056-00": {
    "thin": "assets/cards/portrait/mococo-abyssgard-r5-c001.webp",
    "thumb": "assets/cards/thumb/mococo-abyssgard-r5-c001.webp",
    "full": "assets/cards/full/mococo-abyssgard-r5-c001.webp"
  },
  "card-04017-5-uniq-0080-00": {
    "thin": "assets/cards/portrait/mococo-abyssgard-r5-c002.webp",
    "thumb": "assets/cards/thumb/mococo-abyssgard-r5-c002.webp",
    "full": "assets/cards/full/mococo-abyssgard-r5-c002.webp"
  },
  "card-06002-5-uniq-0058-00": {
    "thin": "assets/cards/portrait/otonose-kanade-r5-c001.webp",
    "thumb": "assets/cards/thumb/otonose-kanade-r5-c001.webp",
    "full": "assets/cards/full/otonose-kanade-r5-c001.webp"
  },
  "card-06002-5-uniq-0066-00": {
    "thin": "assets/cards/portrait/otonose-kanade-r5-c002.webp",
    "thumb": "assets/cards/thumb/otonose-kanade-r5-c002.webp",
    "full": "assets/cards/full/otonose-kanade-r5-c002.webp"
  },
  "card-06003-5-uniq-0059-00": {
    "thin": "assets/cards/portrait/ichijou-ririka-r5-c001.webp",
    "thumb": "assets/cards/thumb/ichijou-ririka-r5-c001.webp",
    "full": "assets/cards/full/ichijou-ririka-r5-c001.webp"
  },
  "card-06003-5-uniq-0091-00": {
    "thin": "assets/cards/portrait/ichijou-ririka-r5-c002.webp",
    "thumb": "assets/cards/thumb/ichijou-ririka-r5-c002.webp",
    "full": "assets/cards/full/ichijou-ririka-r5-c002.webp"
  },
  "card-06004-5-uniq-0060-00": {
    "thin": "assets/cards/portrait/juufuutei-raden-r5-c001.webp",
    "thumb": "assets/cards/thumb/juufuutei-raden-r5-c001.webp",
    "full": "assets/cards/full/juufuutei-raden-r5-c001.webp"
  },
  "card-06005-5-uniq-0061-00": {
    "thin": "assets/cards/portrait/todoroki-hajime-r5-c001.webp",
    "thumb": "assets/cards/thumb/todoroki-hajime-r5-c001.webp",
    "full": "assets/cards/full/todoroki-hajime-r5-c001.webp"
  },
  "card-00007-5-uniq-0096-00": {
    "thin": "assets/cards/portrait/natsuiro-matsuri-r5-c002.webp",
    "thumb": "assets/cards/thumb/natsuiro-matsuri-r5-c002.webp",
    "full": "assets/cards/full/natsuiro-matsuri-r5-c002.webp"
  },
  "card-00027-5-uniq-0092-00": {
    "thin": "assets/cards/portrait/tokoyami-towa-r5-c002.webp",
    "thumb": "assets/cards/thumb/tokoyami-towa-r5-c002.webp",
    "full": "assets/cards/full/tokoyami-towa-r5-c002.webp"
  },
  "card-00032-5-uniq-0093-00": {
    "thin": "assets/cards/portrait/shishiro-botan-r5-c002.webp",
    "thumb": "assets/cards/thumb/shishiro-botan-r5-c002.webp",
    "full": "assets/cards/full/shishiro-botan-r5-c002.webp"
  },
  "card-03007-5-uniq-0100-00": {
    "thin": "assets/cards/portrait/vestia-zeta-r5-c002.webp",
    "thumb": "assets/cards/thumb/vestia-zeta-r5-c002.webp",
    "full": "assets/cards/full/vestia-zeta-r5-c002.webp"
  },
  "card-03008-5-uniq-0095-00": {
    "thin": "assets/cards/portrait/kaela-kovalskia-r5-c002.webp",
    "thumb": "assets/cards/thumb/kaela-kovalskia-r5-c002.webp",
    "full": "assets/cards/full/kaela-kovalskia-r5-c002.webp"
  },
  "card-04014-5-uniq-0094-00": {
    "thin": "assets/cards/portrait/koseki-bijou-r5-c002.webp",
    "thumb": "assets/cards/thumb/koseki-bijou-r5-c002.webp",
    "full": "assets/cards/full/koseki-bijou-r5-c002.webp"
  },
  "card-04015-5-uniq-0099-00": {
    "thin": "assets/cards/portrait/nerissa-ravencroft-r5-c002.webp",
    "thumb": "assets/cards/thumb/nerissa-ravencroft-r5-c002.webp",
    "full": "assets/cards/full/nerissa-ravencroft-r5-c002.webp"
  },
  "card-06004-5-uniq-0098-00": {
    "thin": "assets/cards/portrait/juufuutei-raden-r5-c002.webp",
    "thumb": "assets/cards/thumb/juufuutei-raden-r5-c002.webp",
    "full": "assets/cards/full/juufuutei-raden-r5-c002.webp"
  },
  "card-06005-5-uniq-0097-00": {
    "thin": "assets/cards/portrait/todoroki-hajime-r5-c002.webp",
    "thumb": "assets/cards/thumb/todoroki-hajime-r5-c002.webp",
    "full": "assets/cards/full/todoroki-hajime-r5-c002.webp"
  }
};
  function candidates(cardId){
    const entry=images[cardId];
    return entry ? ['thin','thumb','full'].filter(kind=>entry[kind]).map(kind=>({kind,url:imageUrl(entry[kind])})) : [];
  }
  return {candidates};
})();
