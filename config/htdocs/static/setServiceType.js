function updateStyle(classname, prop, value) {
  for (let i = 0; i < document.styleSheets.length; i++) {
    const styleSheet = document.styleSheets[i];
    const rules = styleSheet.cssRules || styleSheet.rules;
    for (let j = 0; j < rules.length; j++) {
      if (rules[j].selectorText === '.' + classname) {
        rules[j].style[prop] = value;
        return;
      }
    }
  }
}

function addClassToElements(className, ...elementIds) {
  for (let i = 0; i < elementIds.length; i++) {
    document.getElementById(elementIds[i]).classList.add(className);
  }
}

function removeClassFromElements(className, ...elementIds) {
  for (let i = 0; i < elementIds.length; i++) {
    document.getElementById(elementIds[i]).classList.remove(className);
  }
}

function disableElements(disabled, ...elementIds) {
  for (let i = 0; i < elementIds.length; i++) {
    document.getElementById('input-' + elementIds[i]).disabled = disabled;
  }
}

const disabledForLoan = ['copyrightType', 'titleOfComponent', 'authorOfComponent', 'volume', 'issue', 'pagesRequested'];

function changeForm(firstTry, required, notRequired, fieldsDisabled, copyDivOpacity, titleLabel, npl) {
  addClassToElements('is-required', ...Object.keys(required).map(x => `div-${x}`));
  removeClassFromElements('is-required', ...Object.keys(notRequired).map(x => `div-${x}`));
  if (npl) removeClassFromElements('is-required', 'div-pickupLocation');

  disableElements(fieldsDisabled, ...disabledForLoan);
  updateStyle('onlyForCopy', 'opacity', copyDivOpacity);
  document.getElementById('label-title').textContent = titleLabel;

  Object.keys(notRequired).forEach(id => {
    document.getElementById(`error-${id}`).textContent = undefined;
  });

  // Don't display "Please supply ..." messages if it's the first try
  if (firstTry) return;

  Object.keys(required).forEach(id => {
    const caption = required[id];
    const val = document.getElementById(`input-${id}`).value;
    const elem = document.getElementById(`error-${id}`);
    // console.log(`  id '${id}' is required: caption='${caption}', value='${val}'`);
    if (val || (id === 'pickupLocation' && npl)) {
      elem.textContent = undefined;
    } else {
      let s = 'Please supply a';
      if (caption.match(/^[AEIOUaeiou]/)) s += 'n';
      elem.textContent = s + ' ' + caption;
    }
  });
}

const requiredForLoan = {
  'pickupLocation': 'pickup location',
  'title': 'title',
  'author': 'author',
};

const requiredForCopy = {
  'genre': 'genre',
  'publicationDate': 'publication date',
  'copyrightType': 'copyright type',
  'titleOfComponent': 'chapter title',
  'authorOfComponent': 'chapter author',
};

function setServiceType(st, firstTry, npl) {
  if (st === 'loan') {
    changeForm(firstTry, requiredForLoan, requiredForCopy, true, '40%', 'Title', npl);
  } else { // st === 'copy'
    changeForm(firstTry, requiredForCopy, requiredForLoan, false, '100%', 'Title of journal', npl);
  }
}
