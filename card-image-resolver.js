// Verified against WORKSPACE Canonical Card.assetId; unknown IDs are never inferred.
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
    "thin": "assets/cards/thin/img_card_thin_00001-5-uniq-0000-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00001-5-uniq-0000-00.png",
    "full": "assets/cards/full/img_card_full_00001-5-uniq-0000-00.png"
  },
  "card-00002-5-uniq-0001-00": {
    "thin": "assets/cards/thin/img_card_thin_00002-5-uniq-0001-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00002-5-uniq-0001-00.png",
    "full": "assets/cards/full/img_card_full_00002-5-uniq-0001-00.png"
  },
  "card-00004-5-uniq-0005-00": {
    "thin": "assets/cards/thin/img_card_thin_00004-5-uniq-0005-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00004-5-uniq-0005-00.png",
    "full": "assets/cards/full/img_card_full_00004-5-uniq-0005-00.png"
  },
  "card-00004-5-uniq-0081-00": {
    "thin": "assets/cards/thin/img_card_thin_00004-5-uniq-0081-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00004-5-uniq-0081-00.png",
    "full": "assets/cards/full/img_card_full_00004-5-uniq-0081-00.png"
  },
  "card-00005-5-uniq-0006-00": {
    "thin": "assets/cards/thin/img_card_thin_00005-5-uniq-0006-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00005-5-uniq-0006-00.png",
    "full": "assets/cards/full/img_card_full_00005-5-uniq-0006-00.png"
  },
  "card-00006-5-uniq-0007-00": {
    "thin": "assets/cards/thin/img_card_thin_00006-5-uniq-0007-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00006-5-uniq-0007-00.png",
    "full": "assets/cards/full/img_card_full_00006-5-uniq-0007-00.png"
  },
  "card-00006-5-uniq-0074-00": {
    "thin": "assets/cards/thin/img_card_thin_00006-5-uniq-0074-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00006-5-uniq-0074-00.png",
    "full": "assets/cards/full/img_card_full_00006-5-uniq-0074-00.png"
  },
  "card-00007-5-uniq-0008-00": {
    "thin": "assets/cards/thin/img_card_thin_00007-5-uniq-0008-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00007-5-uniq-0008-00.png",
    "full": "assets/cards/full/img_card_full_00007-5-uniq-0008-00.png"
  },
  "card-00010-5-uniq-0010-00": {
    "thin": "assets/cards/thin/img_card_thin_00010-5-uniq-0010-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00010-5-uniq-0010-00.png",
    "full": "assets/cards/full/img_card_full_00010-5-uniq-0010-00.png"
  },
  "card-00010-5-uniq-0069-00": {
    "thin": "assets/cards/thin/img_card_thin_00010-5-uniq-0069-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00010-5-uniq-0069-00.png",
    "full": "assets/cards/full/img_card_full_00010-5-uniq-0069-00.png"
  },
  "card-00011-5-uniq-0011-00": {
    "thin": "assets/cards/thin/img_card_thin_00011-5-uniq-0011-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00011-5-uniq-0011-00.png",
    "full": "assets/cards/full/img_card_full_00011-5-uniq-0011-00.png"
  },
  "card-00012-5-uniq-0012-00": {
    "thin": "assets/cards/thin/img_card_thin_00012-5-uniq-0012-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00012-5-uniq-0012-00.png",
    "full": "assets/cards/full/img_card_full_00012-5-uniq-0012-00.png"
  },
  "card-00012-5-uniq-0062-00": {
    "thin": "assets/cards/thin/img_card_thin_00012-5-uniq-0062-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00012-5-uniq-0062-00.png",
    "full": "assets/cards/full/img_card_full_00012-5-uniq-0062-00.png"
  },
  "card-00013-5-uniq-0002-00": {
    "thin": "assets/cards/thin/img_card_thin_00013-5-uniq-0002-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00013-5-uniq-0002-00.png",
    "full": "assets/cards/full/img_card_full_00013-5-uniq-0002-00.png"
  },
  "card-00014-5-uniq-0013-00": {
    "thin": "assets/cards/thin/img_card_thin_00014-5-uniq-0013-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00014-5-uniq-0013-00.png",
    "full": "assets/cards/full/img_card_full_00014-5-uniq-0013-00.png"
  },
  "card-00014-5-uniq-0075-00": {
    "thin": "assets/cards/thin/img_card_thin_00014-5-uniq-0075-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00014-5-uniq-0075-00.png",
    "full": "assets/cards/full/img_card_full_00014-5-uniq-0075-00.png"
  },
  "card-00015-5-uniq-0003-00": {
    "thin": "assets/cards/thin/img_card_thin_00015-5-uniq-0003-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00015-5-uniq-0003-00.png",
    "full": "assets/cards/full/img_card_full_00015-5-uniq-0003-00.png"
  },
  "card-00015-5-uniq-0067-00": {
    "thin": "assets/cards/thin/img_card_thin_00015-5-uniq-0067-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00015-5-uniq-0067-00.png",
    "full": "assets/cards/full/img_card_full_00015-5-uniq-0067-00.png"
  },
  "card-00016-5-uniq-0014-00": {
    "thin": "assets/cards/thin/img_card_thin_00016-5-uniq-0014-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00016-5-uniq-0014-00.png",
    "full": "assets/cards/full/img_card_full_00016-5-uniq-0014-00.png"
  },
  "card-00016-5-uniq-0076-00": {
    "thin": "assets/cards/thin/img_card_thin_00016-5-uniq-0076-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00016-5-uniq-0076-00.png",
    "full": "assets/cards/full/img_card_full_00016-5-uniq-0076-00.png"
  },
  "card-00017-5-uniq-0015-00": {
    "thin": "assets/cards/thin/img_card_thin_00017-5-uniq-0015-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00017-5-uniq-0015-00.png",
    "full": "assets/cards/full/img_card_full_00017-5-uniq-0015-00.png"
  },
  "card-00017-5-uniq-0077-00": {
    "thin": "assets/cards/thin/img_card_thin_00017-5-uniq-0077-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00017-5-uniq-0077-00.png",
    "full": "assets/cards/full/img_card_full_00017-5-uniq-0077-00.png"
  },
  "card-00018-5-uniq-0004-00": {
    "thin": "assets/cards/thin/img_card_thin_00018-5-uniq-0004-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00018-5-uniq-0004-00.png",
    "full": "assets/cards/full/img_card_full_00018-5-uniq-0004-00.png"
  },
  "card-00018-5-uniq-0068-00": {
    "thin": "assets/cards/thin/img_card_thin_00018-5-uniq-0068-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00018-5-uniq-0068-00.png",
    "full": "assets/cards/full/img_card_full_00018-5-uniq-0068-00.png"
  },
  "card-00019-5-uniq-0016-00": {
    "thin": "assets/cards/thin/img_card_thin_00019-5-uniq-0016-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00019-5-uniq-0016-00.png",
    "full": "assets/cards/full/img_card_full_00019-5-uniq-0016-00.png"
  },
  "card-00021-5-uniq-0017-00": {
    "thin": "assets/cards/thin/img_card_thin_00021-5-uniq-0017-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00021-5-uniq-0017-00.png",
    "full": "assets/cards/full/img_card_full_00021-5-uniq-0017-00.png"
  },
  "card-00021-5-uniq-0064-00": {
    "thin": "assets/cards/thin/img_card_thin_00021-5-uniq-0064-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00021-5-uniq-0064-00.png",
    "full": "assets/cards/full/img_card_full_00021-5-uniq-0064-00.png"
  },
  "card-00022-5-uniq-0018-00": {
    "thin": "assets/cards/thin/img_card_thin_00022-5-uniq-0018-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00022-5-uniq-0018-00.png",
    "full": "assets/cards/full/img_card_full_00022-5-uniq-0018-00.png"
  },
  "card-00022-5-uniq-0063-00": {
    "thin": "assets/cards/thin/img_card_thin_00022-5-uniq-0063-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00022-5-uniq-0063-00.png",
    "full": "assets/cards/full/img_card_full_00022-5-uniq-0063-00.png"
  },
  "card-00023-5-uniq-0019-00": {
    "thin": "assets/cards/thin/img_card_thin_00023-5-uniq-0019-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00023-5-uniq-0019-00.png",
    "full": "assets/cards/full/img_card_full_00023-5-uniq-0019-00.png"
  },
  "card-00023-5-uniq-0085-00": {
    "thin": "assets/cards/thin/img_card_thin_00023-5-uniq-0085-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00023-5-uniq-0085-00.png",
    "full": "assets/cards/full/img_card_full_00023-5-uniq-0085-00.png"
  },
  "card-00026-5-uniq-0021-00": {
    "thin": "assets/cards/thin/img_card_thin_00026-5-uniq-0021-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00026-5-uniq-0021-00.png",
    "full": "assets/cards/full/img_card_full_00026-5-uniq-0021-00.png"
  },
  "card-00026-5-uniq-0065-00": {
    "thin": "assets/cards/thin/img_card_thin_00026-5-uniq-0065-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00026-5-uniq-0065-00.png",
    "full": "assets/cards/full/img_card_full_00026-5-uniq-0065-00.png"
  },
  "card-00027-5-uniq-0022-00": {
    "thin": "assets/cards/thin/img_card_thin_00027-5-uniq-0022-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00027-5-uniq-0022-00.png",
    "full": "assets/cards/full/img_card_full_00027-5-uniq-0022-00.png"
  },
  "card-00028-5-uniq-0023-00": {
    "thin": "assets/cards/thin/img_card_thin_00028-5-uniq-0023-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00028-5-uniq-0023-00.png",
    "full": "assets/cards/full/img_card_full_00028-5-uniq-0023-00.png"
  },
  "card-00028-5-uniq-0070-00": {
    "thin": "assets/cards/thin/img_card_thin_00028-5-uniq-0070-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00028-5-uniq-0070-00.png",
    "full": "assets/cards/full/img_card_full_00028-5-uniq-0070-00.png"
  },
  "card-00030-5-uniq-0024-00": {
    "thin": "assets/cards/thin/img_card_thin_00030-5-uniq-0024-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00030-5-uniq-0024-00.png",
    "full": "assets/cards/full/img_card_full_00030-5-uniq-0024-00.png"
  },
  "card-00030-5-uniq-0089-00": {
    "thin": "assets/cards/thin/img_card_thin_00030-5-uniq-0089-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00030-5-uniq-0089-00.png",
    "full": "assets/cards/full/img_card_full_00030-5-uniq-0089-00.png"
  },
  "card-00031-5-uniq-0025-00": {
    "thin": "assets/cards/thin/img_card_thin_00031-5-uniq-0025-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00031-5-uniq-0025-00.png",
    "full": "assets/cards/full/img_card_full_00031-5-uniq-0025-00.png"
  },
  "card-00032-5-uniq-0026-00": {
    "thin": "assets/cards/thin/img_card_thin_00032-5-uniq-0026-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00032-5-uniq-0026-00.png",
    "full": "assets/cards/full/img_card_full_00032-5-uniq-0026-00.png"
  },
  "card-00034-5-uniq-0027-00": {
    "thin": "assets/cards/thin/img_card_thin_00034-5-uniq-0027-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00034-5-uniq-0027-00.png",
    "full": "assets/cards/full/img_card_full_00034-5-uniq-0027-00.png"
  },
  "card-00034-5-uniq-0090-00": {
    "thin": "assets/cards/thin/img_card_thin_00034-5-uniq-0090-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00034-5-uniq-0090-00.png",
    "full": "assets/cards/full/img_card_full_00034-5-uniq-0090-00.png"
  },
  "card-00035-5-uniq-0028-00": {
    "thin": "assets/cards/thin/img_card_thin_00035-5-uniq-0028-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00035-5-uniq-0028-00.png",
    "full": "assets/cards/full/img_card_full_00035-5-uniq-0028-00.png"
  },
  "card-00035-5-uniq-0082-00": {
    "thin": "assets/cards/thin/img_card_thin_00035-5-uniq-0082-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00035-5-uniq-0082-00.png",
    "full": "assets/cards/full/img_card_full_00035-5-uniq-0082-00.png"
  },
  "card-00036-5-uniq-0029-00": {
    "thin": "assets/cards/thin/img_card_thin_00036-5-uniq-0029-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00036-5-uniq-0029-00.png",
    "full": "assets/cards/full/img_card_full_00036-5-uniq-0029-00.png"
  },
  "card-00036-5-uniq-0078-00": {
    "thin": "assets/cards/thin/img_card_thin_00036-5-uniq-0078-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00036-5-uniq-0078-00.png",
    "full": "assets/cards/full/img_card_full_00036-5-uniq-0078-00.png"
  },
  "card-00037-5-uniq-0030-00": {
    "thin": "assets/cards/thin/img_card_thin_00037-5-uniq-0030-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00037-5-uniq-0030-00.png",
    "full": "assets/cards/full/img_card_full_00037-5-uniq-0030-00.png"
  },
  "card-00037-5-uniq-0086-00": {
    "thin": "assets/cards/thin/img_card_thin_00037-5-uniq-0086-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00037-5-uniq-0086-00.png",
    "full": "assets/cards/full/img_card_full_00037-5-uniq-0086-00.png"
  },
  "card-00039-5-uniq-0032-00": {
    "thin": "assets/cards/thin/img_card_thin_00039-5-uniq-0032-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_00039-5-uniq-0032-00.png",
    "full": "assets/cards/full/img_card_full_00039-5-uniq-0032-00.png"
  },
  "card-03001-5-uniq-0033-00": {
    "thin": "assets/cards/thin/img_card_thin_03001-5-uniq-0033-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_03001-5-uniq-0033-00.png",
    "full": "assets/cards/full/img_card_full_03001-5-uniq-0033-00.png"
  },
  "card-03002-5-uniq-0034-00": {
    "thin": "assets/cards/thin/img_card_thin_03002-5-uniq-0034-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_03002-5-uniq-0034-00.png",
    "full": "assets/cards/full/img_card_full_03002-5-uniq-0034-00.png"
  },
  "card-03003-5-uniq-0035-00": {
    "thin": "assets/cards/thin/img_card_thin_03003-5-uniq-0035-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_03003-5-uniq-0035-00.png",
    "full": "assets/cards/full/img_card_full_03003-5-uniq-0035-00.png"
  },
  "card-03004-5-uniq-0036-00": {
    "thin": "assets/cards/thin/img_card_thin_03004-5-uniq-0036-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_03004-5-uniq-0036-00.png",
    "full": "assets/cards/full/img_card_full_03004-5-uniq-0036-00.png"
  },
  "card-03004-5-uniq-0073-00": {
    "thin": "assets/cards/thin/img_card_thin_03004-5-uniq-0073-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_03004-5-uniq-0073-00.png",
    "full": "assets/cards/full/img_card_full_03004-5-uniq-0073-00.png"
  },
  "card-03005-5-uniq-0037-00": {
    "thin": "assets/cards/thin/img_card_thin_03005-5-uniq-0037-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_03005-5-uniq-0037-00.png",
    "full": "assets/cards/full/img_card_full_03005-5-uniq-0037-00.png"
  },
  "card-03005-5-uniq-0084-00": {
    "thin": "assets/cards/thin/img_card_thin_03005-5-uniq-0084-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_03005-5-uniq-0084-00.png",
    "full": "assets/cards/full/img_card_full_03005-5-uniq-0084-00.png"
  },
  "card-03006-5-uniq-0038-00": {
    "thin": "assets/cards/thin/img_card_thin_03006-5-uniq-0038-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_03006-5-uniq-0038-00.png",
    "full": "assets/cards/full/img_card_full_03006-5-uniq-0038-00.png"
  },
  "card-03007-5-uniq-0039-00": {
    "thin": "assets/cards/thin/img_card_thin_03007-5-uniq-0039-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_03007-5-uniq-0039-00.png",
    "full": "assets/cards/full/img_card_full_03007-5-uniq-0039-00.png"
  },
  "card-03008-5-uniq-0040-00": {
    "thin": "assets/cards/thin/img_card_thin_03008-5-uniq-0040-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_03008-5-uniq-0040-00.png",
    "full": "assets/cards/full/img_card_full_03008-5-uniq-0040-00.png"
  },
  "card-03009-5-uniq-0041-00": {
    "thin": "assets/cards/thin/img_card_thin_03009-5-uniq-0041-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_03009-5-uniq-0041-00.png",
    "full": "assets/cards/full/img_card_full_03009-5-uniq-0041-00.png"
  },
  "card-03009-5-uniq-0088-00": {
    "thin": "assets/cards/thin/img_card_thin_03009-5-uniq-0088-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_03009-5-uniq-0088-00.png",
    "full": "assets/cards/full/img_card_full_03009-5-uniq-0088-00.png"
  },
  "card-04001-5-uniq-0042-00": {
    "thin": "assets/cards/thin/img_card_thin_04001-5-uniq-0042-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_04001-5-uniq-0042-00.png",
    "full": "assets/cards/full/img_card_full_04001-5-uniq-0042-00.png"
  },
  "card-04001-5-uniq-0071-00": {
    "thin": "assets/cards/thin/img_card_thin_04001-5-uniq-0071-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_04001-5-uniq-0071-00.png",
    "full": "assets/cards/full/img_card_full_04001-5-uniq-0071-00.png"
  },
  "card-04002-5-uniq-0043-00": {
    "thin": "assets/cards/thin/img_card_thin_04002-5-uniq-0043-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_04002-5-uniq-0043-00.png",
    "full": "assets/cards/full/img_card_full_04002-5-uniq-0043-00.png"
  },
  "card-04003-5-uniq-0044-00": {
    "thin": "assets/cards/thin/img_card_thin_04003-5-uniq-0044-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_04003-5-uniq-0044-00.png",
    "full": "assets/cards/full/img_card_full_04003-5-uniq-0044-00.png"
  },
  "card-04003-5-uniq-0072-00": {
    "thin": "assets/cards/thin/img_card_thin_04003-5-uniq-0072-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_04003-5-uniq-0072-00.png",
    "full": "assets/cards/full/img_card_full_04003-5-uniq-0072-00.png"
  },
  "card-04007-5-uniq-0047-00": {
    "thin": "assets/cards/thin/img_card_thin_04007-5-uniq-0047-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_04007-5-uniq-0047-00.png",
    "full": "assets/cards/full/img_card_full_04007-5-uniq-0047-00.png"
  },
  "card-04010-5-uniq-0049-00": {
    "thin": "assets/cards/thin/img_card_thin_04010-5-uniq-0049-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_04010-5-uniq-0049-00.png",
    "full": "assets/cards/full/img_card_full_04010-5-uniq-0049-00.png"
  },
  "card-04012-5-uniq-0051-00": {
    "thin": "assets/cards/thin/img_card_thin_04012-5-uniq-0051-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_04012-5-uniq-0051-00.png",
    "full": "assets/cards/full/img_card_full_04012-5-uniq-0051-00.png"
  },
  "card-04012-5-uniq-0087-00": {
    "thin": "assets/cards/thin/img_card_thin_04012-5-uniq-0087-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_04012-5-uniq-0087-00.png",
    "full": "assets/cards/full/img_card_full_04012-5-uniq-0087-00.png"
  },
  "card-04013-5-uniq-0052-00": {
    "thin": "assets/cards/thin/img_card_thin_04013-5-uniq-0052-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_04013-5-uniq-0052-00.png",
    "full": "assets/cards/full/img_card_full_04013-5-uniq-0052-00.png"
  },
  "card-04013-5-uniq-0083-00": {
    "thin": "assets/cards/thin/img_card_thin_04013-5-uniq-0083-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_04013-5-uniq-0083-00.png",
    "full": "assets/cards/full/img_card_full_04013-5-uniq-0083-00.png"
  },
  "card-04014-5-uniq-0053-00": {
    "thin": "assets/cards/thin/img_card_thin_04014-5-uniq-0053-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_04014-5-uniq-0053-00.png",
    "full": "assets/cards/full/img_card_full_04014-5-uniq-0053-00.png"
  },
  "card-04015-5-uniq-0054-00": {
    "thin": "assets/cards/thin/img_card_thin_04015-5-uniq-0054-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_04015-5-uniq-0054-00.png",
    "full": "assets/cards/full/img_card_full_04015-5-uniq-0054-00.png"
  },
  "card-04016-5-uniq-0055-00": {
    "thin": "assets/cards/thin/img_card_thin_04016-5-uniq-0055-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_04016-5-uniq-0055-00.png",
    "full": "assets/cards/full/img_card_full_04016-5-uniq-0055-00.png"
  },
  "card-04016-5-uniq-0079-00": {
    "thin": "assets/cards/thin/img_card_thin_04016-5-uniq-0079-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_04016-5-uniq-0079-00.png",
    "full": "assets/cards/full/img_card_full_04016-5-uniq-0079-00.png"
  },
  "card-04017-5-uniq-0056-00": {
    "thin": "assets/cards/thin/img_card_thin_04017-5-uniq-0056-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_04017-5-uniq-0056-00.png",
    "full": "assets/cards/full/img_card_full_04017-5-uniq-0056-00.png"
  },
  "card-04017-5-uniq-0080-00": {
    "thin": "assets/cards/thin/img_card_thin_04017-5-uniq-0080-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_04017-5-uniq-0080-00.png",
    "full": "assets/cards/full/img_card_full_04017-5-uniq-0080-00.png"
  },
  "card-06002-5-uniq-0058-00": {
    "thin": "assets/cards/thin/img_card_thin_06002-5-uniq-0058-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_06002-5-uniq-0058-00.png",
    "full": "assets/cards/full/img_card_full_06002-5-uniq-0058-00.png"
  },
  "card-06002-5-uniq-0066-00": {
    "thin": "assets/cards/thin/img_card_thin_06002-5-uniq-0066-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_06002-5-uniq-0066-00.png",
    "full": "assets/cards/full/img_card_full_06002-5-uniq-0066-00.png"
  },
  "card-06003-5-uniq-0059-00": {
    "thin": "assets/cards/thin/img_card_thin_06003-5-uniq-0059-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_06003-5-uniq-0059-00.png",
    "full": "assets/cards/full/img_card_full_06003-5-uniq-0059-00.png"
  },
  "card-06003-5-uniq-0091-00": {
    "thin": "assets/cards/thin/img_card_thin_06003-5-uniq-0091-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_06003-5-uniq-0091-00.png",
    "full": "assets/cards/full/img_card_full_06003-5-uniq-0091-00.png"
  },
  "card-06004-5-uniq-0060-00": {
    "thin": "assets/cards/thin/img_card_thin_06004-5-uniq-0060-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_06004-5-uniq-0060-00.png",
    "full": "assets/cards/full/img_card_full_06004-5-uniq-0060-00.png"
  },
  "card-06005-5-uniq-0061-00": {
    "thin": "assets/cards/thin/img_card_thin_06005-5-uniq-0061-00.png",
    "thumb": "assets/cards/thumb/img_card_thumb_06005-5-uniq-0061-00.png",
    "full": "assets/cards/full/img_card_full_06005-5-uniq-0061-00.png"
  }
};
  function candidates(cardId){
    const entry=images[cardId];
    return entry ? ['thin','thumb','full'].filter(kind=>entry[kind]).map(kind=>({kind,url:imageUrl(entry[kind])})) : [];
  }
  return {candidates};
})();
