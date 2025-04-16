function getUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
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
  