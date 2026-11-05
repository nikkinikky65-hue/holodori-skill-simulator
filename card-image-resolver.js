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
    "thin": "assets/cards/webp/portrait/tokino-sora-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/tokino-sora-r5-c001.webp",
    "full": "assets/cards/webp/full/tokino-sora-r5-c001.webp"
  },
  "card-00002-5-uniq-0001-00": {
    "thin": "assets/cards/webp/portrait/robocosan-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/robocosan-r5-c001.webp",
    "full": "assets/cards/webp/full/robocosan-r5-c001.webp"
  },
  "card-00004-5-uniq-0005-00": {
    "thin": "assets/cards/webp/portrait/aki-rosenthal-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/aki-rosenthal-r5-c001.webp",
    "full": "assets/cards/webp/full/aki-rosenthal-r5-c001.webp"
  },
  "card-00004-5-uniq-0081-00": {
    "thin": "assets/cards/webp/portrait/aki-rosenthal-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/aki-rosenthal-r5-c002.webp",
    "full": "assets/cards/webp/full/aki-rosenthal-r5-c002.webp"
  },
  "card-00005-5-uniq-0006-00": {
    "thin": "assets/cards/webp/portrait/akai-haato-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/akai-haato-r5-c001.webp",
    "full": "assets/cards/webp/full/akai-haato-r5-c001.webp"
  },
  "card-00006-5-uniq-0007-00": {
    "thin": "assets/cards/webp/portrait/shirakami-fubuki-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/shirakami-fubuki-r5-c001.webp",
    "full": "assets/cards/webp/full/shirakami-fubuki-r5-c001.webp"
  },
  "card-00006-5-uniq-0074-00": {
    "thin": "assets/cards/webp/portrait/shirakami-fubuki-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/shirakami-fubuki-r5-c002.webp",
    "full": "assets/cards/webp/full/shirakami-fubuki-r5-c002.webp"
  },
  "card-00007-5-uniq-0008-00": {
    "thin": "assets/cards/webp/portrait/natsuiro-matsuri-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/natsuiro-matsuri-r5-c001.webp",
    "full": "assets/cards/webp/full/natsuiro-matsuri-r5-c001.webp"
  },
  "card-00010-5-uniq-0010-00": {
    "thin": "assets/cards/webp/portrait/nakiri-ayame-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/nakiri-ayame-r5-c001.webp",
    "full": "assets/cards/webp/full/nakiri-ayame-r5-c001.webp"
  },
  "card-00010-5-uniq-0069-00": {
    "thin": "assets/cards/webp/portrait/nakiri-ayame-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/nakiri-ayame-r5-c002.webp",
    "full": "assets/cards/webp/full/nakiri-ayame-r5-c002.webp"
  },
  "card-00011-5-uniq-0011-00": {
    "thin": "assets/cards/webp/portrait/yuzuki-choco-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/yuzuki-choco-r5-c001.webp",
    "full": "assets/cards/webp/full/yuzuki-choco-r5-c001.webp"
  },
  "card-00012-5-uniq-0012-00": {
    "thin": "assets/cards/webp/portrait/oozora-subaru-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/oozora-subaru-r5-c001.webp",
    "full": "assets/cards/webp/full/oozora-subaru-r5-c001.webp"
  },
  "card-00012-5-uniq-0062-00": {
    "thin": "assets/cards/webp/portrait/oozora-subaru-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/oozora-subaru-r5-c002.webp",
    "full": "assets/cards/webp/full/oozora-subaru-r5-c002.webp"
  },
  "card-00013-5-uniq-0002-00": {
    "thin": "assets/cards/webp/portrait/azki-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/azki-r5-c001.webp",
    "full": "assets/cards/webp/full/azki-r5-c001.webp"
  },
  "card-00014-5-uniq-0013-00": {
    "thin": "assets/cards/webp/portrait/ookami-mio-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/ookami-mio-r5-c001.webp",
    "full": "assets/cards/webp/full/ookami-mio-r5-c001.webp"
  },
  "card-00014-5-uniq-0075-00": {
    "thin": "assets/cards/webp/portrait/ookami-mio-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/ookami-mio-r5-c002.webp",
    "full": "assets/cards/webp/full/ookami-mio-r5-c002.webp"
  },
  "card-00015-5-uniq-0003-00": {
    "thin": "assets/cards/webp/portrait/sakura-miko-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/sakura-miko-r5-c001.webp",
    "full": "assets/cards/webp/full/sakura-miko-r5-c001.webp"
  },
  "card-00015-5-uniq-0067-00": {
    "thin": "assets/cards/webp/portrait/sakura-miko-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/sakura-miko-r5-c002.webp",
    "full": "assets/cards/webp/full/sakura-miko-r5-c002.webp"
  },
  "card-00016-5-uniq-0014-00": {
    "thin": "assets/cards/webp/portrait/nekomata-okayu-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/nekomata-okayu-r5-c001.webp",
    "full": "assets/cards/webp/full/nekomata-okayu-r5-c001.webp"
  },
  "card-00016-5-uniq-0076-00": {
    "thin": "assets/cards/webp/portrait/nekomata-okayu-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/nekomata-okayu-r5-c002.webp",
    "full": "assets/cards/webp/full/nekomata-okayu-r5-c002.webp"
  },
  "card-00017-5-uniq-0015-00": {
    "thin": "assets/cards/webp/portrait/inugami-korone-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/inugami-korone-r5-c001.webp",
    "full": "assets/cards/webp/full/inugami-korone-r5-c001.webp"
  },
  "card-00017-5-uniq-0077-00": {
    "thin": "assets/cards/webp/portrait/inugami-korone-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/inugami-korone-r5-c002.webp",
    "full": "assets/cards/webp/full/inugami-korone-r5-c002.webp"
  },
  "card-00018-5-uniq-0004-00": {
    "thin": "assets/cards/webp/portrait/hoshimachi-suisei-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/hoshimachi-suisei-r5-c001.webp",
    "full": "assets/cards/webp/full/hoshimachi-suisei-r5-c001.webp"
  },
  "card-00018-5-uniq-0068-00": {
    "thin": "assets/cards/webp/portrait/hoshimachi-suisei-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/hoshimachi-suisei-r5-c002.webp",
    "full": "assets/cards/webp/full/hoshimachi-suisei-r5-c002.webp"
  },
  "card-00019-5-uniq-0016-00": {
    "thin": "assets/cards/webp/portrait/usada-pekora-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/usada-pekora-r5-c001.webp",
    "full": "assets/cards/webp/full/usada-pekora-r5-c001.webp"
  },
  "card-00021-5-uniq-0017-00": {
    "thin": "assets/cards/webp/portrait/shiranui-flare-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/shiranui-flare-r5-c001.webp",
    "full": "assets/cards/webp/full/shiranui-flare-r5-c001.webp"
  },
  "card-00021-5-uniq-0064-00": {
    "thin": "assets/cards/webp/portrait/shiranui-flare-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/shiranui-flare-r5-c002.webp",
    "full": "assets/cards/webp/full/shiranui-flare-r5-c002.webp"
  },
  "card-00022-5-uniq-0018-00": {
    "thin": "assets/cards/webp/portrait/shirogane-noel-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/shirogane-noel-r5-c001.webp",
    "full": "assets/cards/webp/full/shirogane-noel-r5-c001.webp"
  },
  "card-00022-5-uniq-0063-00": {
    "thin": "assets/cards/webp/portrait/shirogane-noel-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/shirogane-noel-r5-c002.webp",
    "full": "assets/cards/webp/full/shirogane-noel-r5-c002.webp"
  },
  "card-00023-5-uniq-0019-00": {
    "thin": "assets/cards/webp/portrait/houshou-marine-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/houshou-marine-r5-c001.webp",
    "full": "assets/cards/webp/full/houshou-marine-r5-c001.webp"
  },
  "card-00023-5-uniq-0085-00": {
    "thin": "assets/cards/webp/portrait/houshou-marine-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/houshou-marine-r5-c002.webp",
    "full": "assets/cards/webp/full/houshou-marine-r5-c002.webp"
  },
  "card-00026-5-uniq-0021-00": {
    "thin": "assets/cards/webp/portrait/tsunomaki-watame-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/tsunomaki-watame-r5-c001.webp",
    "full": "assets/cards/webp/full/tsunomaki-watame-r5-c001.webp"
  },
  "card-00026-5-uniq-0065-00": {
    "thin": "assets/cards/webp/portrait/tsunomaki-watame-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/tsunomaki-watame-r5-c002.webp",
    "full": "assets/cards/webp/full/tsunomaki-watame-r5-c002.webp"
  },
  "card-00027-5-uniq-0022-00": {
    "thin": "assets/cards/webp/portrait/tokoyami-towa-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/tokoyami-towa-r5-c001.webp",
    "full": "assets/cards/webp/full/tokoyami-towa-r5-c001.webp"
  },
  "card-00028-5-uniq-0023-00": {
    "thin": "assets/cards/webp/portrait/himemori-luna-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/himemori-luna-r5-c001.webp",
    "full": "assets/cards/webp/full/himemori-luna-r5-c001.webp"
  },
  "card-00028-5-uniq-0070-00": {
    "thin": "assets/cards/webp/portrait/himemori-luna-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/himemori-luna-r5-c002.webp",
    "full": "assets/cards/webp/full/himemori-luna-r5-c002.webp"
  },
  "card-00030-5-uniq-0024-00": {
    "thin": "assets/cards/webp/portrait/yukihana-lamy-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/yukihana-lamy-r5-c001.webp",
    "full": "assets/cards/webp/full/yukihana-lamy-r5-c001.webp"
  },
  "card-00030-5-uniq-0089-00": {
    "thin": "assets/cards/webp/portrait/yukihana-lamy-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/yukihana-lamy-r5-c002.webp",
    "full": "assets/cards/webp/full/yukihana-lamy-r5-c002.webp"
  },
  "card-00031-5-uniq-0025-00": {
    "thin": "assets/cards/webp/portrait/momosuzu-nene-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/momosuzu-nene-r5-c001.webp",
    "full": "assets/cards/webp/full/momosuzu-nene-r5-c001.webp"
  },
  "card-00032-5-uniq-0026-00": {
    "thin": "assets/cards/webp/portrait/shishiro-botan-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/shishiro-botan-r5-c001.webp",
    "full": "assets/cards/webp/full/shishiro-botan-r5-c001.webp"
  },
  "card-00034-5-uniq-0027-00": {
    "thin": "assets/cards/webp/portrait/omaru-polka-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/omaru-polka-r5-c001.webp",
    "full": "assets/cards/webp/full/omaru-polka-r5-c001.webp"
  },
  "card-00034-5-uniq-0090-00": {
    "thin": "assets/cards/webp/portrait/omaru-polka-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/omaru-polka-r5-c002.webp",
    "full": "assets/cards/webp/full/omaru-polka-r5-c002.webp"
  },
  "card-00035-5-uniq-0028-00": {
    "thin": "assets/cards/webp/portrait/laplus-darknesss-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/laplus-darknesss-r5-c001.webp",
    "full": "assets/cards/webp/full/laplus-darknesss-r5-c001.webp"
  },
  "card-00035-5-uniq-0082-00": {
    "thin": "assets/cards/webp/portrait/laplus-darknesss-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/laplus-darknesss-r5-c002.webp",
    "full": "assets/cards/webp/full/laplus-darknesss-r5-c002.webp"
  },
  "card-00036-5-uniq-0029-00": {
    "thin": "assets/cards/webp/portrait/takane-lui-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/takane-lui-r5-c001.webp",
    "full": "assets/cards/webp/full/takane-lui-r5-c001.webp"
  },
  "card-00036-5-uniq-0078-00": {
    "thin": "assets/cards/webp/portrait/takane-lui-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/takane-lui-r5-c002.webp",
    "full": "assets/cards/webp/full/takane-lui-r5-c002.webp"
  },
  "card-00037-5-uniq-0030-00": {
    "thin": "assets/cards/webp/portrait/hakui-koyori-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/hakui-koyori-r5-c001.webp",
    "full": "assets/cards/webp/full/hakui-koyori-r5-c001.webp"
  },
  "card-00037-5-uniq-0086-00": {
    "thin": "assets/cards/webp/portrait/hakui-koyori-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/hakui-koyori-r5-c002.webp",
    "full": "assets/cards/webp/full/hakui-koyori-r5-c002.webp"
  },
  "card-00039-5-uniq-0032-00": {
    "thin": "assets/cards/webp/portrait/kazama-iroha-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/kazama-iroha-r5-c001.webp",
    "full": "assets/cards/webp/full/kazama-iroha-r5-c001.webp"
  },
  "card-03001-5-uniq-0033-00": {
    "thin": "assets/cards/webp/portrait/ayunda-risu-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/ayunda-risu-r5-c001.webp",
    "full": "assets/cards/webp/full/ayunda-risu-r5-c001.webp"
  },
  "card-03002-5-uniq-0034-00": {
    "thin": "assets/cards/webp/portrait/moona-hoshinova-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/moona-hoshinova-r5-c001.webp",
    "full": "assets/cards/webp/full/moona-hoshinova-r5-c001.webp"
  },
  "card-03003-5-uniq-0035-00": {
    "thin": "assets/cards/webp/portrait/airani-iofifteen-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/airani-iofifteen-r5-c001.webp",
    "full": "assets/cards/webp/full/airani-iofifteen-r5-c001.webp"
  },
  "card-03004-5-uniq-0036-00": {
    "thin": "assets/cards/webp/portrait/kureiji-ollie-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/kureiji-ollie-r5-c001.webp",
    "full": "assets/cards/webp/full/kureiji-ollie-r5-c001.webp"
  },
  "card-03004-5-uniq-0073-00": {
    "thin": "assets/cards/webp/portrait/kureiji-ollie-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/kureiji-ollie-r5-c002.webp",
    "full": "assets/cards/webp/full/kureiji-ollie-r5-c002.webp"
  },
  "card-03005-5-uniq-0037-00": {
    "thin": "assets/cards/webp/portrait/anya-melfissa-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/anya-melfissa-r5-c001.webp",
    "full": "assets/cards/webp/full/anya-melfissa-r5-c001.webp"
  },
  "card-03005-5-uniq-0084-00": {
    "thin": "assets/cards/webp/portrait/anya-melfissa-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/anya-melfissa-r5-c002.webp",
    "full": "assets/cards/webp/full/anya-melfissa-r5-c002.webp"
  },
  "card-03006-5-uniq-0038-00": {
    "thin": "assets/cards/webp/portrait/pavolia-reine-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/pavolia-reine-r5-c001.webp",
    "full": "assets/cards/webp/full/pavolia-reine-r5-c001.webp"
  },
  "card-03007-5-uniq-0039-00": {
    "thin": "assets/cards/webp/portrait/vestia-zeta-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/vestia-zeta-r5-c001.webp",
    "full": "assets/cards/webp/full/vestia-zeta-r5-c001.webp"
  },
  "card-03008-5-uniq-0040-00": {
    "thin": "assets/cards/webp/portrait/kaela-kovalskia-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/kaela-kovalskia-r5-c001.webp",
    "full": "assets/cards/webp/full/kaela-kovalskia-r5-c001.webp"
  },
  "card-03009-5-uniq-0041-00": {
    "thin": "assets/cards/webp/portrait/kobo-kanaeru-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/kobo-kanaeru-r5-c001.webp",
    "full": "assets/cards/webp/full/kobo-kanaeru-r5-c001.webp"
  },
  "card-03009-5-uniq-0088-00": {
    "thin": "assets/cards/webp/portrait/kobo-kanaeru-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/kobo-kanaeru-r5-c002.webp",
    "full": "assets/cards/webp/full/kobo-kanaeru-r5-c002.webp"
  },
  "card-04001-5-uniq-0042-00": {
    "thin": "assets/cards/webp/portrait/mori-calliope-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/mori-calliope-r5-c001.webp",
    "full": "assets/cards/webp/full/mori-calliope-r5-c001.webp"
  },
  "card-04001-5-uniq-0071-00": {
    "thin": "assets/cards/webp/portrait/mori-calliope-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/mori-calliope-r5-c002.webp",
    "full": "assets/cards/webp/full/mori-calliope-r5-c002.webp"
  },
  "card-04002-5-uniq-0043-00": {
    "thin": "assets/cards/webp/portrait/takanashi-kiara-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/takanashi-kiara-r5-c001.webp",
    "full": "assets/cards/webp/full/takanashi-kiara-r5-c001.webp"
  },
  "card-04003-5-uniq-0044-00": {
    "thin": "assets/cards/webp/portrait/ninomae-inanis-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/ninomae-inanis-r5-c001.webp",
    "full": "assets/cards/webp/full/ninomae-inanis-r5-c001.webp"
  },
  "card-04003-5-uniq-0072-00": {
    "thin": "assets/cards/webp/portrait/ninomae-inanis-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/ninomae-inanis-r5-c002.webp",
    "full": "assets/cards/webp/full/ninomae-inanis-r5-c002.webp"
  },
  "card-04007-5-uniq-0047-00": {
    "thin": "assets/cards/webp/portrait/irys-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/irys-r5-c001.webp",
    "full": "assets/cards/webp/full/irys-r5-c001.webp"
  },
  "card-04010-5-uniq-0049-00": {
    "thin": "assets/cards/webp/portrait/ouro-kronii-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/ouro-kronii-r5-c001.webp",
    "full": "assets/cards/webp/full/ouro-kronii-r5-c001.webp"
  },
  "card-04012-5-uniq-0051-00": {
    "thin": "assets/cards/webp/portrait/hakos-baelz-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/hakos-baelz-r5-c001.webp",
    "full": "assets/cards/webp/full/hakos-baelz-r5-c001.webp"
  },
  "card-04012-5-uniq-0087-00": {
    "thin": "assets/cards/webp/portrait/hakos-baelz-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/hakos-baelz-r5-c002.webp",
    "full": "assets/cards/webp/full/hakos-baelz-r5-c002.webp"
  },
  "card-04013-5-uniq-0052-00": {
    "thin": "assets/cards/webp/portrait/shiori-novella-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/shiori-novella-r5-c001.webp",
    "full": "assets/cards/webp/full/shiori-novella-r5-c001.webp"
  },
  "card-04013-5-uniq-0083-00": {
    "thin": "assets/cards/webp/portrait/shiori-novella-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/shiori-novella-r5-c002.webp",
    "full": "assets/cards/webp/full/shiori-novella-r5-c002.webp"
  },
  "card-04014-5-uniq-0053-00": {
    "thin": "assets/cards/webp/portrait/koseki-bijou-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/koseki-bijou-r5-c001.webp",
    "full": "assets/cards/webp/full/koseki-bijou-r5-c001.webp"
  },
  "card-04015-5-uniq-0054-00": {
    "thin": "assets/cards/webp/portrait/nerissa-ravencroft-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/nerissa-ravencroft-r5-c001.webp",
    "full": "assets/cards/webp/full/nerissa-ravencroft-r5-c001.webp"
  },
  "card-04016-5-uniq-0055-00": {
    "thin": "assets/cards/webp/portrait/fuwawa-abyssgard-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/fuwawa-abyssgard-r5-c001.webp",
    "full": "assets/cards/webp/full/fuwawa-abyssgard-r5-c001.webp"
  },
  "card-04016-5-uniq-0079-00": {
    "thin": "assets/cards/webp/portrait/fuwawa-abyssgard-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/fuwawa-abyssgard-r5-c002.webp",
    "full": "assets/cards/webp/full/fuwawa-abyssgard-r5-c002.webp"
  },
  "card-04017-5-uniq-0056-00": {
    "thin": "assets/cards/webp/portrait/mococo-abyssgard-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/mococo-abyssgard-r5-c001.webp",
    "full": "assets/cards/webp/full/mococo-abyssgard-r5-c001.webp"
  },
  "card-04017-5-uniq-0080-00": {
    "thin": "assets/cards/webp/portrait/mococo-abyssgard-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/mococo-abyssgard-r5-c002.webp",
    "full": "assets/cards/webp/full/mococo-abyssgard-r5-c002.webp"
  },
  "card-06002-5-uniq-0058-00": {
    "thin": "assets/cards/webp/portrait/otonose-kanade-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/otonose-kanade-r5-c001.webp",
    "full": "assets/cards/webp/full/otonose-kanade-r5-c001.webp"
  },
  "card-06002-5-uniq-0066-00": {
    "thin": "assets/cards/webp/portrait/otonose-kanade-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/otonose-kanade-r5-c002.webp",
    "full": "assets/cards/webp/full/otonose-kanade-r5-c002.webp"
  },
  "card-06003-5-uniq-0059-00": {
    "thin": "assets/cards/webp/portrait/ichijou-ririka-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/ichijou-ririka-r5-c001.webp",
    "full": "assets/cards/webp/full/ichijou-ririka-r5-c001.webp"
  },
  "card-06003-5-uniq-0091-00": {
    "thin": "assets/cards/webp/portrait/ichijou-ririka-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/ichijou-ririka-r5-c002.webp",
    "full": "assets/cards/webp/full/ichijou-ririka-r5-c002.webp"
  },
  "card-06004-5-uniq-0060-00": {
    "thin": "assets/cards/webp/portrait/juufuutei-raden-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/juufuutei-raden-r5-c001.webp",
    "full": "assets/cards/webp/full/juufuutei-raden-r5-c001.webp"
  },
  "card-06005-5-uniq-0061-00": {
    "thin": "assets/cards/webp/portrait/todoroki-hajime-r5-c001.webp",
    "thumb": "assets/cards/webp/thumb/todoroki-hajime-r5-c001.webp",
    "full": "assets/cards/webp/full/todoroki-hajime-r5-c001.webp"
  },
  "card-00007-5-uniq-0096-00": {
    "thin": "assets/cards/webp/portrait/natsuiro-matsuri-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/natsuiro-matsuri-r5-c002.webp",
    "full": "assets/cards/webp/full/natsuiro-matsuri-r5-c002.webp"
  },
  "card-00027-5-uniq-0092-00": {
    "thin": "assets/cards/webp/portrait/tokoyami-towa-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/tokoyami-towa-r5-c002.webp",
    "full": "assets/cards/webp/full/tokoyami-towa-r5-c002.webp"
  },
  "card-00032-5-uniq-0093-00": {
    "thin": "assets/cards/webp/portrait/shishiro-botan-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/shishiro-botan-r5-c002.webp",
    "full": "assets/cards/webp/full/shishiro-botan-r5-c002.webp"
  },
  "card-03007-5-uniq-0100-00": {
    "thin": "assets/cards/webp/portrait/vestia-zeta-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/vestia-zeta-r5-c002.webp",
    "full": "assets/cards/webp/full/vestia-zeta-r5-c002.webp"
  },
  "card-03008-5-uniq-0095-00": {
    "thin": "assets/cards/webp/portrait/kaela-kovalskia-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/kaela-kovalskia-r5-c002.webp",
    "full": "assets/cards/webp/full/kaela-kovalskia-r5-c002.webp"
  },
  "card-04014-5-uniq-0094-00": {
    "thin": "assets/cards/webp/portrait/koseki-bijou-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/koseki-bijou-r5-c002.webp",
    "full": "assets/cards/webp/full/koseki-bijou-r5-c002.webp"
  },
  "card-04015-5-uniq-0099-00": {
    "thin": "assets/cards/webp/portrait/nerissa-ravencroft-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/nerissa-ravencroft-r5-c002.webp",
    "full": "assets/cards/webp/full/nerissa-ravencroft-r5-c002.webp"
  },
  "card-06004-5-uniq-0098-00": {
    "thin": "assets/cards/webp/portrait/juufuutei-raden-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/juufuutei-raden-r5-c002.webp",
    "full": "assets/cards/webp/full/juufuutei-raden-r5-c002.webp"
  },
  "card-06005-5-uniq-0097-00": {
    "thin": "assets/cards/webp/portrait/todoroki-hajime-r5-c002.webp",
    "thumb": "assets/cards/webp/thumb/todoroki-hajime-r5-c002.webp",
    "full": "assets/cards/webp/full/todoroki-hajime-r5-c002.webp"
  }
};
  function candidates(cardId){
    const entry=images[cardId];
    return entry ? ['thin','thumb','full'].filter(kind=>entry[kind]).map(kind=>({kind,url:imageUrl(entry[kind])})) : [];
  }
  return {candidates};
})();
