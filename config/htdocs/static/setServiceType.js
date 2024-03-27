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

const requiredForLoan = ['div-pickupLocation', 'div-title', 'div-author'];
const requiredForCopy = ['div-genre', 'div-publicationDate', 'div-copyrightType', 'div-titleOfComponent', 'div-authorOfComponent'];

function setServiceType(st) {
  // XXX we need to actually disable the fields we grey out
  updateStyle('onlyForCopy', 'opacity', st === 'copy' ? '100%' : '40%');

  // XXX we need to actually require the fields we mark as mandatory
  if (st === 'loan') {
    addClassToElements('is-required', ...requiredForLoan);
    removeClassFromElements('is-required', ...requiredForCopy);
  } else {
    addClassToElements('is-required', ...requiredForCopy);
    removeClassFromElements('is-required', ...requiredForLoan);
    // XXX In the Details section, can the label Title be changed to Title of Journal?
  }
}
