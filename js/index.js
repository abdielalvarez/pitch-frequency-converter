const noteSelect = document.getElementById('note-input');
const indexSelect = document.getElementById('index-input');
const frequencyReferenceInput = document.getElementById('frequency-reference-input');
const frequencyResultButton = document.getElementById('frequency-result-button');
const frequencyResult = document.getElementById('frequency-result');
const frequencyInput = document.getElementById('frequency-input');
const noteResultButton = document.getElementById('note-result-button');
const noteResult = document.getElementById('note-result');
const acousticResultButton = document.getElementById('acoustic-result-button');
const acousticResult = document.getElementById('acoustic-result');
const cromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const acousticSoundToHertz = async () => {
    try {
        acousticResultButton.classList.add('blink');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        const audioStream = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let maxDecibel = -Infinity;
        let maxFrequency = 0;
        audioStream.connect(analyser);
        const analyzeFrequencies = () => {
            analyser.getByteFrequencyData(dataArray);
            for (let i = 0; i < bufferLength; i++) {
                const decibel = dataArray[i];
                if (decibel > maxDecibel) {
                    maxDecibel = decibel;
                    maxFrequency = i * audioContext.sampleRate / analyser.fftSize;
                }
            }
        };
        let capturaActiva = true;
        const tiempoInicial = Date.now();
        while (capturaActiva) {
            analyzeFrequencies();
            if (Date.now() - tiempoInicial >= 5000) {
                capturaActiva = false;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        stream.getTracks().forEach(track => track.stop());
        const maxFrequencyValue = maxFrequency.toFixed(2);
        const fullNote = getMusicalNote(maxFrequencyValue);
        const { note, acousticIndex } = parseMusicalNote(fullNote)
        const text = `
            Strongest Sound Frecuency ${maxFrequencyValue} Hz<br>
            Decibels ${maxDecibel} db<br>
            Musical Note ${note}${acousticIndex}
        `;
        acousticResult.innerHTML = text;
    } catch (error) {
        const text = `
            There was an error trying to get the sound to hertz,
            could you try to put your audio closer?`;
        acousticResult.textContent = text;
        console.error('Error al acceder al micrófono:', error);
    } finally {
        acousticResultButton.classList.remove('blink');
    }
}

const calculateFrequency = (note, referenceFrequency = 440) => {
    const octave = parseInt(note.slice(-1));
    const keyNumber = cromaticScale.indexOf(note.slice(0, -1));
    if (keyNumber < 0) {
        return null;
    }
    return referenceFrequency * Math.pow(2, (octave - 4 + (keyNumber - 9) / 12));
};

const getMusicalNote = (frequency) => {
    const refNote = { name: 'A', octave: 4, frequency: 440 };
    const refNoteNumber = refNote.octave * 12 + cromaticScale.indexOf(refNote.name);
    const noteNumber = Math.ceil(12 * Math.log2(frequency / refNote.frequency)) + refNoteNumber;
    const octave = Math.floor(noteNumber / 12);
    const note = cromaticScale[noteNumber % 12];
    return note + octave;
};

const handleChange = (event) => {
    return event;
};

const parseMusicalNote = (fullNote) => {
    const acousticIndex = parseInt(fullNote.match(/-?\d+/)[0]);
    const note = fullNote.replace(acousticIndex, '')
    return {
        note,
        acousticIndex
    }
}

const handleGetFrecuency = (event) => {
    event.preventDefault();
    const note = noteSelect.value;
    const index = indexSelect.value;
    const frequencyReference = frequencyReferenceInput.value || 440;
    const noteWithIndex = `${note}${index}`
    const calculated = calculateFrequency(noteWithIndex, frequencyReference);
    const result = String(calculated.toFixed(2));
    frequencyInput.value = result
    frequencyResult.textContent = `${result} Hz`
};

const handleGetMusicalNote = (event) => {
    event.preventDefault();
    const frequency = frequencyInput.value;
    const fullNote = getMusicalNote(frequency);
    const { note, acousticIndex } = parseMusicalNote(fullNote)
    noteSelect.value = note;
    indexSelect.value = String(acousticIndex);
    noteResult.textContent = `${note}${acousticIndex} Musical Note`
};

noteSelect.addEventListener('change', handleChange);
indexSelect.addEventListener('change', handleChange);
frequencyReferenceInput.addEventListener('change', handleChange);
frequencyInput.addEventListener('change', handleChange);
frequencyResultButton.addEventListener('click', handleGetFrecuency);
noteResultButton.addEventListener('click', handleGetMusicalNote);
acousticResultButton.addEventListener('click', acousticSoundToHertz)