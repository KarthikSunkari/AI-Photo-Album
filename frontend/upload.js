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

  const extension = file.name.split('.').pop();
  const objectKey = `photo-${getUUID()}.${extension}`;
  const uploadUrl = `https://qrugrpzgh6.execute-api.us-east-2.amazonaws.com/dev/upload/${objectKey}`;

  statusEl.style.display = "block";
  statusEl.textContent = "Uploading...";
  statusEl.className = "status uploading";

  try {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'x-api-key': 'N6eV67GB0PaygKEjCSZXm3O9eenRAKhN12pdDwMl',
        'x-amz-meta-customLabels': customLabels,
      },
      body: file
    });

    statusEl.textContent = res.ok
      ? "✅ Upload successful!"
      : "❌ Upload failed. Please try again.";
    statusEl.className = res.ok ? "status success" : "status error";
  } catch (error) {
    console.error(error);
    statusEl.textContent = "❌ Error occurred during upload.";
    statusEl.className = "status error";
  }
};

// === Search Handler ===
document.getElementById('searchForm').onsubmit = async (e) => {
  e.preventDefault();
  const query = document.getElementById('searchQuery').value.trim();
  const resultsEl = document.getElementById('searchResults');
  resultsEl.innerHTML = '';

  if (!query) return;

  try {
    const response = await fetch(`https://qrugrpzgh6.execute-api.us-east-2.amazonaws.com/dev/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'x-api-key': 'N6eV67GB0PaygKEjCSZXm3O9eenRAKhN12pdDwMl',
      }
    });
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const photos = data.results.map(photo => `
        <div class="photo-card">
          <img src="${photo.url}" alt="photo" />
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

  