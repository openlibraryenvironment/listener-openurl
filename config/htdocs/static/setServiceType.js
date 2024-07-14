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
  removeClassFromElements('is-required', ...Object.keys(notRequired).map(x => `div-${x}`));
  addClassToElements('is-required', ...Object.keys(required).map(x => `div-${x}`));
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
  'title': 'title',
  'genre': 'genre',
  'publicationDate': 'publication date',
  'copyrightType': 'copyright type',
  'titleOfComponent': 'chapter title',
  'authorOfComponent': 'chapter author',
  'pickupLocation': 'pickup location',
};

function setServiceType(st, firstTry, npl) {
  if (st === 'loan') {
    changeForm(firstTry, requiredForLoan, requiredForCopy, true, '40%', 'Title', npl);
  } else { // st === 'copy'
    changeForm(firstTry, requiredForCopy, requiredForLoan, false, '100%', 'Title of book/journal', npl);
  }
  addSubmitButtonListener(st);
}

function isFormValid(requiredForCopy) {
  if (!requiredForCopy || Object.keys(requiredForCopy).length === 0) {
    return false;
  }
  for (const key of Object.keys(requiredForCopy)) {
    const inputElement = document.getElementById(`input-${key}`);
    if (!inputElement || !inputElement.value) {
      return false;
    }
  }
  return true;
}

function addSubmitButtonListener(serviceType) {
  const complianceAcceptedKey = 'complianceAccepted';
  const showElementCssClass = 'show';
  const hideElementCssClass = 'hide';

  const submitButton = document.querySelector('.button--primary#submitButton');
  submitButton.replaceWith(submitButton.cloneNode(true));

  const newSubmitButton = document.querySelector('.button--primary#submitButton');
  const complianceModal = document.querySelector('.modal#complianceModal');
  const form = document.querySelector('.page#form');
  const complianceAcceptedValue = window.sessionStorage.getItem(complianceAcceptedKey) === 'true';

  newSubmitButton.addEventListener('click', function(event) {
    if (serviceType === 'copy') {
      if (!isFormValid(requiredForCopy)) {
        return;
      }

      if (!complianceAcceptedValue) {
        event.preventDefault();
        complianceModal.classList.replace(hideElementCssClass, showElementCssClass);
        return;
      }
      form.submit();
    }
  });
}

function initializeComplianceCheck(serviceType) {
  document.addEventListener('DOMContentLoaded', function() {
    addSubmitButtonListener(serviceType);

    const complianceModal = document.querySelector('.modal#complianceModal');
    const acceptComplianceButton = document.querySelector('.button--primary#acceptComplianceButton');
    const complianceAcceptedKey = 'complianceAccepted';
    const hideElementCssClass = 'hide';
    const showElementCssClass = 'show';

    acceptComplianceButton.addEventListener('click', function() {
      window.sessionStorage.setItem(complianceAcceptedKey, 'true');
      complianceModal.classList.replace(showElementCssClass, hideElementCssClass);
      document.querySelector('.page#form').submit();
    });
  });
}

function closeModal() {
  const complianceModal = document.querySelector('.modal#complianceModal');
  complianceModal.classList.replace('show', 'hide');
  changeForm(false, requiredForCopy, requiredForLoan, false, '100%', 'Title of book/journal', false);
}
