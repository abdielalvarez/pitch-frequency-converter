const noteSelect = document.getElementById('note-input');
const indexSelect = document.getElementById('index-input');
const frequencyReferenceInput = document.getElementById('frequency-reference-input');
const frequencyResultButton = document.getElementById('frequency-result-button');
const frequencyResult = document.getElementById('frequency-result');
const frequencyInput = document.getElementById('frequency-input');
const noteResultButton = document.getElementById('note-result-button');
const noteResult = document.getElementById('note-result');
const cromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

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
    const noteNumber = Math.round(12 * Math.log2(frequency / refNote.frequency)) + refNoteNumber;
    const octave = Math.floor(noteNumber / 12);
    const note = cromaticScale[noteNumber % 12];
    return note + octave;
};

const handleChange = (event) => {
    return event;
};

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
    const acousticIndex = parseInt(fullNote.match(/-?\d+/)[0]);
    const note = fullNote.replace(acousticIndex, '')
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