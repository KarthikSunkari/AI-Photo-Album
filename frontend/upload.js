// === Initialize SDK ===
const apigClient = apigClientFactory.newClient({
  apiKey: '8XVBs9wPaiwN5zXXRNPG3FN4w5QYVro5CTXqAYR6',
  accessKey: '',
  secretKey: '',
  sessionToken: '',
  region: 'us-east-1',
  defaultContentType: 'application/json',
  defaultAcceptType: 'application/json'
});


console.log("apigClient loaded:", typeof apigClientFactory);


// UUID generator (v4-style)
function getUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// === Upload Handler ===
document.getElementById('uploadForm').onsubmit = async (e) => {
  e.preventDefault();

  const file = document.getElementById('photoFile').files[0];
  const customLabels = document.getElementById('customLabels').value.trim();
  const statusEl = document.getElementById('status');

  if (!file) {
    alert("Please select a file.");
    return;
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert("Please select an image file.");
    return;
  }

  const extension = file.name.split('.').pop().toLowerCase();
  const objectKey = `photo-${getUUID()}.${extension}`;

  statusEl.style.display = "block";
  statusEl.textContent = "Uploading...";
  statusEl.className = "status uploading";

  const reader = new FileReader();

  reader.onload = async function () {
    const body = reader.result.split(',')[1]; // Remove data URI prefix

    const params = {
      objectKey: objectKey,
      'x-amz-meta-customLabels': customLabels
    };

    const additionalParams = {
      headers: {
        'Content-Type': 'text/plain',
        'x-amz-meta-customLabels': customLabels,
      }
    };

    try {
      const res = await apigClient.uploadObjectKeyPut(params, body, additionalParams);
      statusEl.textContent = "✅ Upload successful!";
      statusEl.className = "status success";
    } catch (error) {
      console.error("Upload error:", error);
      statusEl.textContent = "❌ Upload failed. Please try again.";
      statusEl.className = "status error";
    }
  };

  reader.readAsDataURL(file); // ✅ Triggers base64 encoding
};


// === Search Handler ===
document.getElementById('searchForm').onsubmit = async (e) => {
  e.preventDefault();
  const query = document.getElementById('searchQuery').value.trim();
  const resultsEl = document.getElementById('searchResults');
  resultsEl.innerHTML = '';

  if (!query) return;

  try {
    const params = { q: query };
    const body = {};
    const additionalParams = {};

    const response = await apigClient.searchGet(params, body, additionalParams);
    const data = response.data;
    console.log(data);

    if (data && data.length > 0) {
      const photos = data.map(photo => `
        <div class="photo-card">
          <img src="https://${photo.bucket}.s3.amazonaws.com/${photo.objectKey}" alt="photo" />
        </div>`).join('');
      resultsEl.innerHTML = `<div class="gallery">${photos}</div>`;
    } else {
      resultsEl.textContent = "No photos found.";
    }
  } catch (err) {
    console.error("Search error:", err);
    resultsEl.textContent = "❌ Error while searching.";
  }
};
