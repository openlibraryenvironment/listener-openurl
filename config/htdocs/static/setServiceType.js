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

function changeForm(required, notRequired, fieldsDisabled, copyDivOpacity, titleLabel) {
  addClassToElements('is-required', ...Object.keys(required).map(x => `div-${x}`));
  removeClassFromElements('is-required', ...Object.keys(notRequired).map(x => `div-${x}`));
  disableElements(fieldsDisabled, ...disabledForLoan);
  updateStyle('onlyForCopy', 'opacity', copyDivOpacity);
  document.getElementById('label-title').textContent = titleLabel;
}

const requiredForLoan = {
  'pickupLocation': 'pickup location',
  'title': 'title',
  'author': 'author',
};

const requiredForCopy = {
  'genre': 'genre',
  'publicationDate': 'publication date',
  'copyrightType': true,
  'titleOfComponent': 'chapter title',
  'authorOfComponent': 'chapter author',
};

function setServiceType(st) {
  if (st === 'loan') {
    changeForm(requiredForLoan, requiredForCopy, true, '40%', 'Title');
  } else { // st === 'copy'
    changeForm(requiredForCopy, requiredForLoan, false, '100%', 'Title of journal');
  }
}
