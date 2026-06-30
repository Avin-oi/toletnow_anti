// ===== STEPPER LOGIC =====
let currentStep = 1;
const totalSteps = 3;

function goToStep(step) {
  // Validate Step 1 before moving to 2
  if (step === 2 && currentStep === 1) {
    if (!document.getElementById('propType').value || 
        !document.getElementById('propBhk').value ||
        !document.getElementById('propRent').value) {
      showToast('⚠️ Please fill required fields (Type, BHK, Rent)');
      return;
    }
  }

  // Validate Step 2 before moving to 3
  if (step === 3 && currentStep === 2) {
    if (!document.getElementById('locDoor').value || 
        !document.getElementById('locStreet').value ||
        !document.getElementById('locArea').value ||
        !document.getElementById('ownerName').value ||
        !document.getElementById('ownerPhone').value) {
      showToast('⚠️ Please fill all required location and contact details');
      return;
    }
  }

  // Hide all steps
  document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
  // Show target step
  document.getElementById(`step${step}`).classList.add('active');
  
  // Update UI
  currentStep = step;
  updateStepperUI();
  window.scrollTo(0,0);
}

function updateStepperUI() {
  const line = document.getElementById('stepLine');
  if (currentStep === 1) line.style.width = '0%';
  if (currentStep === 2) line.style.width = '50%';
  if (currentStep === 3) line.style.width = '100%';

  for (let i = 1; i <= totalSteps; i++) {
    const stepEl = document.getElementById(`stepper${i}`);
    if (i < currentStep) {
      stepEl.className = 'step completed';
    } else if (i === currentStep) {
      stepEl.className = 'step active';
    } else {
      stepEl.className = 'step';
    }
  }
}

// ===== PILL TOGGLE LOGIC =====
document.querySelectorAll('.pill').forEach(pill => {
  pill.addEventListener('click', () => {
    pill.classList.toggle('selected');
  });
});

function getSelectedPills(containerId) {
  const pills = document.querySelectorAll(`#${containerId} .pill.selected`);
  return Array.from(pills).map(p => p.getAttribute('data-val'));
}

// ===== PHOTO UPLOAD LOGIC =====
let uploadedPhotos = [];

function handleFiles(files) {
  const fileArray = Array.from(files);
  
  fileArray.forEach(file => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedPhotos.push(e.target.result);
      renderPhotoPreviews();
    };
    reader.readAsDataURL(file);
  });
}

function removePhoto(index) {
  uploadedPhotos.splice(index, 1);
  renderPhotoPreviews();
}

function renderPhotoPreviews() {
  const grid = document.getElementById('photoPreviewGrid');
  grid.innerHTML = '';
  
  uploadedPhotos.forEach((src, idx) => {
    const item = document.createElement('div');
    item.className = 'photo-preview-item';
    item.innerHTML = `
      <img src="${src}" />
      <button class="photo-remove" onclick="removePhoto(${idx})">✕</button>
    `;
    grid.appendChild(item);
  });

  const err = document.getElementById('photoErrorMsg');
  if (err) {
    err.style.display = 'none';
  }
}

// ===== TOAST UTILITY =====
function showToast(msg) {
  const toast = document.getElementById('toast');
  if(!toast) return;
  toast.textContent = msg;
  toast.className = 'toast show';
  setTimeout(() => toast.className = 'toast', 3000);
}

// ===== SUBMIT PROPERTY =====
async function submitProperty() {
  // Photos are optional now, no validation needed here.

  const btn = document.querySelector('.btn-submit');
  btn.disabled = true;
  btn.textContent = 'Posting...';

  // Gather Data
  const propertyData = {
    // Step 1
    type: document.getElementById('propType').value,
    bhk: document.getElementById('propBhk').value,
    rent: parseInt(document.getElementById('propRent').value) || 0,
    deposit: parseInt(document.getElementById('propDeposit').value) || 0,
    furnishing: document.getElementById('propFurnishing').value,
    area: parseInt(document.getElementById('propArea').value) || 0,
    preferred_tenants: getSelectedPills('tenantPills'),
    // amenities: getSelectedPills('amenityPills'), // Commented out due to missing column in Supabase
    
    // Step 2
    door_no: document.getElementById('locDoor').value,
    street: document.getElementById('locStreet').value,
    locality: document.getElementById('locLocality').value || document.getElementById('locArea').value,
    city: document.getElementById('locCity').value,
    state: document.getElementById('locState').value,
    pincode: document.getElementById('locPin').value,
    landmark: document.getElementById('locLandmark').value,
    description: document.getElementById('propDesc').value,
    owner_name: document.getElementById('ownerName').value,
    owner_phone: document.getElementById('ownerPhone').value,
    
    // Step 3 (Store as base64 array temporarily until Storage Bucket is setup)
    images: uploadedPhotos,
    
    // Meta
    status: 'Active',
    created_at: new Date().toISOString()
  };

  try {
    // Try to get authenticated owner ID
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (session) {
      propertyData.owner_id = session.user.id;
    } else {
      // Mock ID for local testing if not logged in
      propertyData.owner_id = 'local-test-owner';
    }

    const { data, error } = await window.supabaseClient
      .from('properties')
      .insert([propertyData]);

    if (error) {
      console.error(error);
      throw error;
    }

    showToast('✅ Property Posted Successfully!');
    setTimeout(async () => {
      // Re-fetch properties and switch tab if on dashboard
      if (typeof initOwnerProfilePage === 'function') {
        await initOwnerProfilePage();
        if (typeof switchProfileTab === 'function') switchProfileTab('properties');
        
        // Reset the form
        document.getElementById('propertyForm').reset();
        document.getElementById('photoGrid').innerHTML = '';
        uploadedPhotos = [];
        document.getElementById('step1').classList.add('active');
        document.getElementById('step2').classList.remove('active');
        document.getElementById('step3').classList.remove('active');
        document.getElementById('stepper1').classList.add('active');
        document.getElementById('stepper2').classList.remove('active');
        document.getElementById('stepper3').classList.remove('active');
        document.getElementById('stepLine').style.width = '0%';
      } else {
        window.location.href = 'owner-profile.html';
      }
    }, 1500);

  } catch (err) {
    showToast('❌ Error posting property. Please check console.');
    btn.disabled = false;
    btn.textContent = 'Post Property';
  }
}

