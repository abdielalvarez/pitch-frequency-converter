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
const ctxContainer = document.getElementById('chart-container');
const ctx = document.getElementById('chart');
const cromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

let frequencies = []
let decibels = []

const chart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: frequencies,
        datasets: [{
            label: 'Decibels',
            data: decibels,
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

const generateBarColors = (decibels) => {
    const colors = [];
    const maxDecibelIndex = decibels.indexOf(Math.max(...decibels));
    for (let i = 0; i < decibels.length; i++) {
        if (i === maxDecibelIndex) {
            colors.push('#ff0000');
        } else {
            const hue = (i / decibels.length) * 360;
            const color = `hsl(${hue}, 80%, 80%)`;
            colors.push(color);
        }
    }
    return colors;
};

const sortParsedObject = (parsedObject) => {
    parsedObject.sort((a, b) => {
        if (a.acousticIndex !== b.acousticIndex) {
            return a.acousticIndex - b.acousticIndex;
        } else {
            return cromaticScale.indexOf(a.note) - cromaticScale.indexOf(b.note);
        }
    });
    return parsedObject;
};

const updateChartData = (frequencies, decibels) => {
    if (frequencies.length > 0) {
        chart.data.labels = frequencies;
        chart.data.datasets[0].data = decibels;
        const colors = generateBarColors(decibels);
        chart.data.datasets[0].backgroundColor = colors;
        chart.data.datasets[0].borderColor = 'rgba(0, 0, 0, 0)';
        chart.options.plugins.legend.labels.boxWidth = 0;
        ctxContainer.style.display = 'block';
        chart.update();
    } else {
        ctxContainer.style.display = 'none';
    }
};
updateChartData([], []);

const acousticSoundToHertz = async () => {
    try {
        updateChartData([], []);
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
        const maxFrequencies = [];
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
            if (Date.now() - tiempoInicial >= 3500) {
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

        const frequenciesWithDecibels = [];
        for (let i = 0; i < bufferLength; i++) {
            const decibel = dataArray[i];
            frequenciesWithDecibels.push({ frequency: i * audioContext.sampleRate / analyser.fftSize, decibel });
        }
        frequenciesWithDecibels.sort((a, b) => b.decibel - a.decibel);
        maxFrequencies.push(...frequenciesWithDecibels.slice(0, 7));
        maxFrequencies.sort((a, b) => a.frequency - b.frequency);
        maxFrequencies.splice(7);

        const parsedObject = maxFrequencies.map(freqObject => {
            const { frequency, decibel } = freqObject
            const fullNote = getMusicalNote(frequency);
            const { note, acousticIndex } = parseMusicalNote(fullNote)
            return {
                fullNote,
                note,
                acousticIndex,
                frequency,
                decibel
            }
        })
        const sortedObject = sortParsedObject(parsedObject) 
        frequenciesInfo = sortedObject.map(entry => {
            return `${entry.frequency.toFixed(2)} (${entry.fullNote})`
        });
        decibels = sortedObject.map(entry => entry.decibel);
        updateChartData(frequenciesInfo, decibels);

    } catch (error) {
        let text = `
            There was an error trying to get the sound to hertz,
            could you try to put your audio closer?`;
        if (
            error.message.includes('Permission denied') ||
            error.message.includes('Permission dismissed')
        ) {
            text = 'You need to allow the microphone to detect the Hertz'
            alert('You need to allow the microphone to detect the Hertz in the browser settings')
        }
        acousticResult.textContent = text;
        console.error(error.message);
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
    frequencyResult.textContent = `${result} Hz`
};

const handleGetMusicalNote = (event) => {
    event.preventDefault();
    const frequency = frequencyInput.value;
    const fullNote = getMusicalNote(frequency);
    const { note, acousticIndex } = parseMusicalNote(fullNote)
    noteResult.textContent = `${note}${acousticIndex} Musical Note`
};

noteSelect.addEventListener('change', handleChange);
indexSelect.addEventListener('change', handleChange);
frequencyReferenceInput.addEventListener('change', handleChange);
frequencyInput.addEventListener('change', handleChange);
frequencyResultButton.addEventListener('click', handleGetFrecuency);
noteResultButton.addEventListener('click', handleGetMusicalNote);
acousticResultButton.addEventListener('click', acousticSoundToHertz)