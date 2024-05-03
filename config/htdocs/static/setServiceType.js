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

  Object.keys(notRequired).forEach(id => {
    document.getElementById(`error-${id}`).textContent = undefined;
  });

  // XXX don't display these if it's the first try

  Object.keys(required).forEach(id => {
    const caption = required[id];
    const val = document.getElementById(`input-${id}`).value;
    const elem = document.getElementById(`error-${id}`);
    // console.log(`  id '${id}' is required: caption='${caption}', value='${val}'`);
    if (val) {
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

function setServiceType(st, firstTry) {
  if (st === 'loan') {
    changeForm(requiredForLoan, requiredForCopy, true, '40%', 'Title');
  } else { // st === 'copy'
    changeForm(requiredForCopy, requiredForLoan, false, '100%', 'Title of journal');
  }
}
