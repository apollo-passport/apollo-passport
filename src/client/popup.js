// From meteor/packages/oauth/oauth_browser.js
/* istanbul ignore next */
export default function openCenteredPopup(url, width, height) {
  var screenX = typeof window.screenX !== 'undefined'
        ? window.screenX : window.screenLeft;
  var screenY = typeof window.screenY !== 'undefined'
        ? window.screenY : window.screenTop;
  var outerWidth = typeof window.outerWidth !== 'undefined'
        ? window.outerWidth : document.body.clientWidth;
  var outerHeight = typeof window.outerHeight !== 'undefined'
        ? window.outerHeight : (document.body.clientHeight - 22);
  // XXX what is the 22?

  // Use `outerWidth - width` and `outerHeight - height` for help in
  // positioning the popup centered relative to the current window
  var left = screenX + (outerWidth - width) / 2;
  var top = screenY + (outerHeight - height) / 2;
  var features = ('width=' + width + ',height=' + height +
                  ',left=' + left + ',top=' + top + ',scrollbars=yes');

  var newwindow = window.open(url, 'Login', features);

  if (typeof newwindow === 'undefined') {
    // blocked by a popup blocker maybe?
    var err = new Error("The login popup was blocked by the browser");
    err.attemptedUrl = url;
    throw err;
  }

  if (newwindow.focus)
    newwindow.focus();

  return newwindow;
}
