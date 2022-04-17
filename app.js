const colors = [
	'rgb(255, 99, 132)',
	'rgb(54, 162, 235)',
	'rgb(153, 102, 255)',
	'rgb(255, 205, 86)',
	'rgb(75, 192, 192)',
	'rgb(255, 159, 64)',
	'rgb(201, 203, 207)',
]

const context = document.getElementById('chart').getContext('2d')
const chart = new Chart(context, {
	type: 'bar',
	data: {
		datasets: [
			{
				label: '',
				data: [],
				backgroundColor: colors,
			},
		],
	},
	options: {
		scales: {
			y: {
				beginAtZero: true,
			},
		},
		maintainAspectRatio: false,
		responsive: true,
		animation: false,
	},
})

const clearResults = () => {
	chart.data.datasets[0].data = 0
	chart.update()
}

const valueToLabel = (value) => {
	if (value === undefined) {
		return 'undefined'
	}
	if (value === null) {
		return 'null'
	}
	if (typeof value === 'string') {
		return value
	}
	if (typeof value === 'number') {
		return value.toString()
	}
	return JSON.stringify(value)
}

const addResult = (value) => {
	const label = valueToLabel(value)
	const found = chart.data.datasets[0].data.find((item) => item.x === label)
	if (found) {
		found.y++
	} else {
		chart.data.datasets[0].data.push({ x: label, y: 1 })
	}

	const padIfNumber = (label) => {
		if (`${parseInt(label, 10)}` === label) {
			return label.padStart(20)
		}
		return label
	}
	chart.data.datasets[0].data.sort((a, b) =>
		padIfNumber(a.x).localeCompare(padIfNumber(b.x)),
	)
	chart.update()
}

const { run, pause, getIsRunning } = (() => {
	let timer
	const interval = 100
	let isRunning = false

	const run = (testedFunction) => {
		isRunning = true
		const loop = () => {
			timer = setTimeout(() => {
				addResult(testedFunction())
				loop()
			}, interval)
		}
		loop()
	}
	const pause = () => {
		isRunning = false
		clearTimeout(timer)
	}

	const getIsRunning = () => isRunning

	return { run, pause, getIsRunning }
})()

const formElement = document.querySelector('#form')
const codeElement = formElement.querySelector('textarea')
const submitElement = formElement.querySelector('button')
let lastUsedCode = ''
let isStopped = true

formElement.addEventListener('submit', (event) => {
	event.preventDefault()

	const newCode = codeElement.value

	const evalNewCode = (code) => {
		const arrowFunctionRegex =
			/^\s*.*(?:const|let)\s+(.*)\s*\=\s*\(.*\)\s*\=\>\s*(?:\{([\S\s]*)\}|([\S\s]*))\s*$/m
		const arrowFunctionResult = code.match(arrowFunctionRegex)
		if (arrowFunctionResult !== null) {
			return new Function(arrowFunctionResult[2])
		}

		const functionRegex =
			/^\s*.*(?:function)\s+(.*)\s*\(.*\)\s*\{([\S\s]*)\}\s*$/m
		const functionResult = code.match(functionRegex)
		if (functionResult !== null) {
			return new Function(functionResult[2])
		}

		return null
	}

	if (submitElement.innerText === 'Run') {
		const testedFunction = evalNewCode(newCode)
		if (testedFunction) {
			lastUsedCode = newCode
			isStopped = false
			run(testedFunction)
		} else {
			alert('Function definition not found.')
		}
	} else if (submitElement.innerText === 'Stop') {
		pause()
		clearResults()
		isStopped = true
	} else if (submitElement.innerText === 'Pause') {
		pause()
	}
	updateSubmitButtonText()
})

const updateSubmitButtonText = () => {
	if (codeElement.value === lastUsedCode) {
		submitElement.innerText = getIsRunning() ? 'Pause' : 'Run'
	} else {
		submitElement.innerText = isStopped ? 'Run' : 'Stop'
	}
}

codeElement.addEventListener('input', updateSubmitButtonText)
