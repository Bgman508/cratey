// Client-side audio preview generator
// Extracts first 30 seconds of audio files for previews

export async function generatePreviewFromAudio(audioFile, durationSeconds = 30) {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Calculate samples for preview duration
        const sampleRate = audioBuffer.sampleRate;
        const previewLength = Math.min(durationSeconds * sampleRate, audioBuffer.length);
        const numberOfChannels = audioBuffer.numberOfChannels;
        
        // Create new buffer for preview
        const previewBuffer = audioContext.createBuffer(
          numberOfChannels,
          previewLength,
          sampleRate
        );
        
        // Copy audio data for preview duration
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const channelData = audioBuffer.getChannelData(channel);
          const previewData = previewBuffer.getChannelData(channel);
          for (let i = 0; i < previewLength; i++) {
            previewData[i] = channelData[i];
          }
        }
        
        // Convert buffer to WAV blob
        const wavBlob = bufferToWave(previewBuffer, previewLength);
        const previewFile = new File(
          [wavBlob], 
          audioFile.name.replace(/\.[^/.]+$/, '') + '_preview.wav',
          { type: 'audio/wav' }
        );
        
        audioContext.close();
        resolve(previewFile);
      } catch (error) {
        audioContext.close();
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read audio file'));
    };

    reader.readAsArrayBuffer(audioFile);
  });
}

// Convert AudioBuffer to WAV file
function bufferToWave(abuffer, len) {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let offset = 0;
  let pos = 0;

  // Write WAV header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // Write interleaved data
  for (let i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (pos < len) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][pos]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return new Blob([buffer], { type: 'audio/wav' });

  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}