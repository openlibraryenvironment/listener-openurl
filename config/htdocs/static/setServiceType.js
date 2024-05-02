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

const disabledForLoan = ['copyrightType', 'titleOfComponent', 'authorOfComponent', 'volume', 'issue', 'pagesRequested'];

function setServiceType(st) {
  // XXX we need to actually require the fields we mark as mandatory
  if (st === 'loan') {
    addClassToElements('is-required', ...Object.keys(requiredForLoan).map(x => `div-${x}`));
    removeClassFromElements('is-required', ...Object.keys(requiredForCopy).map(x => `div-${x}`));
    disableElements(true, ...disabledForLoan);
    updateStyle('onlyForCopy', 'opacity', '40%');
    document.getElementById("label-title").textContent = "Title";
  } else { // st === 'copy'
    addClassToElements('is-required', ...Object.keys(requiredForCopy).map(x => `div-${x}`));
    removeClassFromElements('is-required', ...Object.keys(requiredForLoan).map(x => `div-${x}`));
    disableElements(false, ...disabledForLoan);
    updateStyle('onlyForCopy', 'opacity', '100%');
    document.getElementById("label-title").textContent = "Title of journal";
  }
}
