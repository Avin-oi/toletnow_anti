
// ===== POST PROPERTY LOGIC =====

let currentStep = 1;
const totalSteps = 3;

// CHIP SELECTION
function toggleChip(element) {
  element.classList.toggle('selected');
}

function selectChip(groupId, element, value) {
  const group = document.getElementById(groupId);
  const chips = group.querySelectorAll('.chip');
  chips.forEach(c => c.classList.remove('selected'));
  element.classList.add('selected');
  
  // Update hidden input if necessary
  if (groupId === 'furnishingGroup') {
    document.getElementById('propFurnishing').value = value;
  }
}

// CHAR COUNTER
function updateCharCount() {
  const desc = document.getElementById('propDesc');
  const count = document.getElementById('charCount');
  if (desc && count) {
    count.textContent = desc.value.length;
  }
}

// LIVE PREVIEW UPDATE
function updateLivePreview() {
  const type = document.getElementById('propType')?.value || 'Property';
  const bhk = document.getElementById('propBhk')?.value || 'BHK';
  const rent = document.getElementById('propRent')?.value || '0';
  const locality = document.getElementById('propLocality')?.value || 'Locality';

  const lpType = document.getElementById('lp-type');
  const lpBhk = document.getElementById('lp-bhk');
  const lpRent = document.getElementById('lp-rent');
  const lpLocality = document.getElementById('lp-locality');

  if (lpType) lpType.textContent = type;
  if (lpBhk) lpBhk.textContent = bhk;
  if (lpRent) lpRent.textContent = new Intl.NumberFormat('en-IN').format(rent);
  if (lpLocality) lpLocality.textContent = locality;
}

// WIZARD NAVIGATION
function validateStep(step) {
  if (step === 1) {
    const type = document.getElementById('propType').value;
    const bhk = document.getElementById('propBhk').value;
    const rent = document.getElementById('propRent').value;
    const area = document.getElementById('propArea').value;
    
    if (!type || !bhk || !rent || !area) {
      alert('Please fill all required fields in this step.');
      return false;
    }
  } else if (step === 2) {
    const locality = document.getElementById('propLocality').value;
    const address = document.getElementById('propAddress').value;
    const desc = document.getElementById('propDesc').value;
    const name = document.getElementById('ownerName').value;
    const phone = document.getElementById('ownerPhone').value;
    
    if (!locality || !address || !desc || !name || !phone) {
      alert('Please fill all required fields in this step.');
      return false;
    }
    
    if (!/^[0-9]{10}$/.test(phone)) {
      alert('Please enter a valid 10-digit phone number.');
      return false;
    }
  }
  return true;
}

function nextStep(step) {
  if (!validateStep(step - 1)) return;
  
  document.getElementById(`step-${step - 1}`).classList.remove('active');
  document.getElementById(`step-${step}`).classList.add('active');
  
  // Update Stepper
  document.getElementById(`indicator-${step - 1}`).classList.add('completed');
  document.getElementById(`indicator-${step - 1}`).classList.remove('active');
  document.getElementById(`indicator-${step}`).classList.add('active');
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep(step) {
  document.getElementById(`step-${step + 1}`).classList.remove('active');
  document.getElementById(`step-${step}`).classList.add('active');
  
  // Update Stepper
  document.getElementById(`indicator-${step + 1}`).classList.remove('active');
  document.getElementById(`indicator-${step}`).classList.remove('completed');
  document.getElementById(`indicator-${step}`).classList.add('active');
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// DRAG AND DROP PHOTOS
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const thumbnailGrid = document.getElementById('thumbnailGrid');
let uploadedFiles = [];

if (dropZone) {
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });
}

function handleFiles(files) {
  const newFiles = Array.from(files).slice(0, 5 - uploadedFiles.length);
  
  newFiles.forEach(file => {
    if (!file.type.startsWith('image/')) return;
    
    uploadedFiles.push(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const thumbHTML = `
        <div class="thumb-item">
          <img src="${e.target.result}" alt="Property Photo">
          <button type="button" class="thumb-remove" onclick="removeFile(${uploadedFiles.length - 1}, this)">×</button>
        </div>
      `;
      thumbnailGrid.insertAdjacentHTML('beforeend', thumbHTML);
      
      // Update Live Preview Image
      const previewImgBox = document.querySelector('.lc-img-box');
      if (uploadedFiles.length === 1 && previewImgBox) {
        previewImgBox.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
      }
    };
    reader.readAsDataURL(file);
  });
}

function removeFile(index, btnElem) {
  uploadedFiles.splice(index, 1);
  btnElem.parentElement.remove();
  
  // Update Live Preview if no images left
  if (uploadedFiles.length === 0) {
    const previewImgBox = document.querySelector('.lc-img-box');
    if (previewImgBox) {
      previewImgBox.innerHTML = `<div class="lc-placeholder">No Photo Uploaded</div>`;
    }
  }
}

// FORM SUBMISSION
const form = document.getElementById('postPropertyForm');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('submitListingBtn');
    btn.textContent = 'Publishing...';
    btn.disabled = true;
    
    // Simulate API Call
    setTimeout(() => {
      document.getElementById('step-3').classList.remove('active');
      document.getElementById('step-success').classList.add('active');
      document.getElementById('indicator-3').classList.add('completed');
      document.getElementById('indicator-3').classList.remove('active');
      document.querySelector('.pp-stepper').style.display = 'none';
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1500);
  });
}

// INITIALIZE
updateLivePreview();
updateCharCount();
