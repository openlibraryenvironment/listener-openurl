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

function changeForm(required, notRequired, fieldsDisabled, copyDivOpacity, titleLabel, data) {
  addClassToElements('is-required', ...Object.keys(required).map(x => `div-${x}`));
  removeClassFromElements('is-required', ...Object.keys(notRequired).map(x => `div-${x}`));
  disableElements(fieldsDisabled, ...disabledForLoan);
  updateStyle('onlyForCopy', 'opacity', copyDivOpacity);
  document.getElementById('label-title').textContent = titleLabel;

  Object.keys(notRequired).forEach(id => {
    document.getElementById(`error-${id}`).textContent = undefined;
  });

  Object.keys(required).forEach(id => {
    const cfg = required[id];
    if (cfg !== true) {
      const [key, caption] = cfg;
      const val = data[key];
      const elem = document.getElementById(`error-${id}`);
      // console.log(`id '${id}' is required: key='${key}', caption='${caption}', value='${val}'`);
      if (val) {
        elem.textContent = undefined;
      } else {
        elem.textContent = 'Please supply a ' + caption;
      }
    }
  });
}

const requiredForLoan = {
  'pickupLocation': ['svc.pickupLocation', 'pickup location'],
  'title': ['rft.title', 'title'],
  'author': ['rft.au', 'author'],
};

const requiredForCopy = {
  'genre': ['rft.genre', 'genre'],
  'publicationDate': ['rft.date', 'publication date'],
  'copyrightType': true,
  'titleOfComponent': ['rft.titleOfComponent', 'chapter title'],
  'authorOfComponent': ['rft.authorOfComponent', 'chapter author'],
};

function setServiceType(st, firstTry, json) {
  const data = JSON.parse(json);
  if (st === 'loan') {
    changeForm(requiredForLoan, requiredForCopy, true, '40%', 'Title', data);
  } else { // st === 'copy'
    changeForm(requiredForCopy, requiredForLoan, false, '100%', 'Title of journal', data);
  }
}
