// Presentation only: retain contents and unknown syntax; never interpret HTML.
function skillDescriptionText(value){
  return String(value ?? '').replace(/\[(?:attribute=[a-zA-Z0-9_-]+|\/attribute|highlight|\/highlight)\]/g, '');
}
