// Variable global para almacenar la posición del cursor
let cursorPosition = 0;
// Función para actualizar la previsualización
function updatePreview() {
    const equationInput = document.getElementById("equationInput").value;
    const previewDiv = document.getElementById("equationPreview");

    // Convertir la ecuación ingresada a formato MathJax
    previewDiv.innerHTML = `\\(${equationInput}\\)`;

    // Renderizar MathJax
    MathJax.typesetPromise().catch((err) => console.log("Error al renderizar MathJax:", err));
}

// Escuchar eventos de entrada en tiempo real
document.getElementById("equationInput").addEventListener("input", updatePreview);

// Detectar la posición del cursor en el campo de entrada
document.getElementById('equationInput').addEventListener('click', getCursorPosition);
document.getElementById('equationInput').addEventListener('keyup', getCursorPosition);
function clearInput() {
    const input = document.getElementById('equationInput');
    input.value = '';  // Borra el contenido del campo de entrada
    input.focus();     // Coloca el foco nuevamente en el campo de entrada
    cursorPosition = 0; // Resetea la posición del cursor
}3

// Función para obtener y almacenar la posición actual del cursor
function getCursorPosition() {
    const input = document.getElementById('equationInput');
    cursorPosition = input.selectionStart;
}

// Función para insertar o reemplazar texto en el campo de entrada
function insertFunction(func) {
    const input = document.getElementById('equationInput');
    const start = input.selectionStart;
    const end = input.selectionEnd;

    // Si hay texto seleccionado, reemplazar la selección
    if (start !== end) {
        input.value = input.value.slice(0, start) + func + input.value.slice(end);
        cursorPosition = start + func.length; // Actualizar la posición del cursor
    } else {
        // Si no hay selección, insertar el texto en la posición del cursor
        input.value = input.value.slice(0, cursorPosition) + func + input.value.slice(cursorPosition);
        cursorPosition += func.length; // Actualizar la posición del cursor
    }

    // Enfocar el campo de entrada y colocar el cursor en la nueva posición
    input.focus();
    input.setSelectionRange(cursorPosition, cursorPosition);
    updatePreview()
}

// Función para validar la ecuación ingresada (polinomios, racionales, raíces, etc.)
function validateEquation(equation) {
    if (!equation.trim()) {
        return "La ecuación no puede estar vacía.";
    }
    // Validar caracteres válidos, incluyendo funciones pow, nthRoot y la coma
    if (!/^[0-9x\+\-\*\/\^\(\)\.\sabsqrtlogsincoetanpownthRoot,]+$/.test(equation)) {
        return "La ecuación contiene caracteres inválidos.";
    }

    // Validar paréntesis equilibrados
    let stack = [];
    for (let char of equation) {
        if (char === '(') stack.push(char);
        if (char === ')') {
            if (!stack.length) return "Paréntesis desequilibrados.";
            stack.pop();
        }
    }
    if (stack.length) return "Paréntesis desequilibrados.";
    

    // Validar funciones racionales con denominador = 0
    const rationalMatch = equation.match(/\/(.+)/);
    if (rationalMatch) {
        const denominator = rationalMatch[1];
        try {
            const expr = math.compile(denominator);
            for (let x = -10; x <= 10; x += 0.1) {
                const y = expr.evaluate({ x });
                if (y === 0) {
                    return "El denominador no puede ser igual a 0 en ningún punto.";
                }
            }
        } catch (error) {
            return "Función racional inválida: " + error.message;
        }
    }

    // Validar raíces negativas para sqrt() y nthRoot()
    const sqrtAndNthRootMatch = equation.match(/(sqrt\([^)]+\)|nthRoot\([^)]+\))/g);
    if (sqrtAndNthRootMatch) {
        for (const match of sqrtAndNthRootMatch) {
            const isNthRoot = match.startsWith("nthRoot");

            if (isNthRoot) {
                // Extraer argumentos de nthRoot(x, n)
                const nthRootParts = match.match(/nthRoot\(([^,]+),\s*([^)]+)\)/);
                if (!nthRootParts) {
                    return "Función de raíz inválida: formato incorrecto.";
                }

                const insideNthRoot = nthRootParts[1];
                const index = parseInt(nthRootParts[2], 10);

                try {
                    const expr = math.compile(insideNthRoot);

                    // Evaluar solo en valores no negativos cuando el índice es par
                    for (let x = 0; x <= 10; x += 0.1) {
                        const y = expr.evaluate({ x });
                        if (y < 0 && index % 2 === 0) {
                            return "El contenido de nthRoot() debe ser mayor o igual a 0 para índices pares.";
                        }
                    }
                } catch (error) {
                    return "Función de raíz inválida: " + error.message;
                }
            } else {
                // Caso de sqrt()
                const insideSqrt = match.slice(5, -1);
                try {
                    const expr = math.compile(insideSqrt);

                    // Evaluar solo en valores no negativos para sqrt
                    for (let x = 0; x <= 10; x += 0.1) {
                        const y = expr.evaluate({ x });
                        if (y < 0) {
                            return "El contenido de sqrt() debe ser mayor o igual a 0.";
                        }
                    }
                } catch (error) {
                    return "Función con raíz inválida: " + error.message;
                }
            }
        }
    }

    return "";
}

// Función para GRAFICAR la ecuación ingresada
function plotGraph() {
    const equationInput = document.getElementById("equationInput").value;
    const equation = document.getElementById('equationInput').value;
    const xMinInput = document.getElementById('xMinInput').value;
    const xMaxInput = document.getElementById('xMaxInput').value;

    const xMin = xMinInput ? parseFloat(xMinInput) : xMinInput;
    const xMax = xMaxInput ? parseFloat(xMaxInput) : xMaxInput;
    const step = 0.01;       
    const limitY = 1000000;

    const errorMessage = validateEquation(equation);
    if (errorMessage) {
        alert(errorMessage);
        document.getElementById('equationInput').style.borderColor = 'red';
        return;
    }else {
        document.getElementById('equationInput').style.borderColor = '';
    }

    if ((xMin === '') || (xMax === '')) {
        alert("Debe especificar los rangos correctamente");
        document.getElementById('xMinInput').style.borderColor = 'red';
        document.getElementById('xMaxInput').style.borderColor = 'red';
        return;
    }else{
        document.getElementById('xMinInput').style.borderColor = '';
        document.getElementById('xMaxInput').style.borderColor = '';
    }
    if (xMin >= xMax) {
        alert("El rango mínimo debe ser menor que el rango máximo.");
        document.getElementById('xMinInput').style.borderColor = 'red';
        document.getElementById('xMaxInput').style.borderColor = 'red';
        return;
    }else{
        document.getElementById('xMinInput').style.borderColor = '';
        document.getElementById('xMaxInput').style.borderColor = '';
    }

    try {
        const expr = math.compile(equation);
        const xValues = [];
        const yValues = [];

        for (let x = xMin; x <= xMax; x += step) {
            xValues.push(x);
            let y;
            try {
                y = expr.evaluate({ x });
                if (Math.abs(y) > limitY) {
                    y = null;
                }
            } catch (error) { // Captura el error aquí
                y = null;
                console.error("Plotgraph (segundo try) err:", error);
            }
            yValues.push(y);
        }

        const trace = {
            x: xValues,
            y: yValues,
            mode: 'lines',
            line: { color: 'blue', width: 2.3 }
        };

        const layout = {
            title: 'Gráfica de la función: ' + equation,
            xaxis: { title: 'x', showgrid: true, zeroline: true, range: [-10, 10] },
            yaxis: { title: 'y', range: [-10, 10], showgrid: true, zeroline: true, scaleanchor: 'x', scaleratio: 1 },
            width: 600,
            height: 600,
            autosize: false,
            margin: { l: 50, r: 50, t: 50, b: 50 },
            shapes: [
                { type: 'line', x0: 0, y0: -100000, x1: 0, y1: 100000, line: { color: 'black', width: 1.3 } },
                { type: 'line', x0: -100000, y0: 0, x1: 100000, y1: 0, line: { color: 'black', width: 1.3 } }
            ],
            dragmode: 'pan',
            hovermode: 'closest'
        };

        const config = {
            responsive: true,
            scrollZoom: true
        };

        Plotly.newPlot('graphContainer', [trace], layout, config);

        // Llamar a showInfo para mostrar información extra sobre la función
        console.log("Llamando a showInfo con la ecuación:", equation);
        showInfo(equation);
        document.getElementById('info_funtion_name').innerHTML = `\\(${equation}\\)`;
        MathJax.typeset(); // Forzar la renderización de MathJax

    } catch (error) {
        
        console.error("Error (plotGraph): " , error);
    }
}

function derive(equation) {
    try {
        // Calculamos las derivadas usando math.js
        const firstDerivative = math.derivative(equation, 'x').toString();
        const secondDerivative = math.derivative(firstDerivative, 'x').toString();

        // Formateamos para MathJax usando formato TeX
        const firstDerivativeTeX = `\\frac{d}{dx}(${equation}) = ${firstDerivative}`;
        const secondDerivativeTeX = `\\frac{d^2}{dx^2}(${equation}) = ${secondDerivative}`;

        return { 
            firstDerivativeTeX, 
            secondDerivativeTeX 
        };
    } catch (error) {
        console.error("Error al calcular derivadas:", error);
        alert("Error al calcular las derivadas.");
    }
}


// Función para encontrar puntos críticos y clasificarlos
function findCriticalPoints(equation) {
    try {
        // Derivadas primera y segunda
        const firstDerivative = math.derivative(equation, 'x').toString();
        const secondDerivative = math.derivative(firstDerivative, 'x').toString();

        // Funciones evaluables
        const fPrime = math.compile(firstDerivative);
        const fDoublePrime = math.compile(secondDerivative);

        const maxima = [];
        const minima = [];
        const inflectionPoints = [];

        const range = [-10, 10];
        const step = 0.1;

        // Paso 1: Identificar puntos críticos usando la primera derivada
        for (let x = range[0]; x <= range[1]; x += step) {
            const yPrime = fPrime.evaluate({ x });
            const yPrimeNext = fPrime.evaluate({ x: x + step });

            // Detectar cambio de signo en f'(x)
            if (Math.sign(yPrime) !== Math.sign(yPrimeNext)) {
                const criticalX = parseFloat(x.toFixed(4));
                const yDoublePrime = fDoublePrime.evaluate({ x: criticalX });

                // Aplicando el Test de la Segunda Derivada
                if (yDoublePrime > 0) {
                    minima.push(criticalX); // Mínimo local
                } else if (yDoublePrime < 0) {
                    maxima.push(criticalX); // Máximo local
                }
            }
        }

        // Paso 2: Identificar puntos de inflexión usando la segunda derivada
        for (let x = range[0]; x <= range[1]; x += step) {
            const yDoublePrime = fDoublePrime.evaluate({ x });
            const yDoublePrimeNext = fDoublePrime.evaluate({ x: x + step });

            // Cambio de signo en la segunda derivada
            if (Math.sign(yDoublePrime) !== Math.sign(yDoublePrimeNext)) {
                const inflectionX = parseFloat(x.toFixed(4));
                inflectionPoints.push(inflectionX);
            }
        }

        // Eliminamos duplicados y redondeamos valores
        const roundValues = (arr) => [...new Set(arr.map(v => parseFloat(v.toFixed(4))))];

        return {
            maxima: roundValues(maxima),
            minima: roundValues(minima),
            inflectionPoints: roundValues(inflectionPoints)
        };

    } catch (error) {
        console.error("Error al calcular los puntos críticos:", error);
        return { maxima: [], minima: [], inflectionPoints: [] };
    }
}
//*******************************************/

// para calcular el dominio = son 3 = createDomain(),evaluateConditions(),calculateDomain().
// Generar un dominio de valores para evaluar (de -100 a 100 con incrementos de 1, por ejemplo)
function createDomain(start = -3000, end = 3000, step = 1) {
    let domain = [];
    for (let x = start; x <= end; x += step) {
        domain.push(x);
    }
    return domain;
}

// Función para evaluar restricciones en una expresión
function evaluateConditions(expression, x) {
    // Reemplazar "x" en la expresión por el valor actual
    let expr = expression.replace(/x/g, `(${x})`);
    try {
        // Evaluar la expresión
        let result = math.evaluate(expr);
        // Verificar que el resultado sea un número válido
        return isFinite(result);
    } catch (error) {
        return false;
    }
}

// Calcular el dominio de una expresión ingresada
function calculateDomain(expression) {
    const domain = createDomain();
    let validDomain = [];

    // Evaluar cada valor del dominio generado
    for (let x of domain) {
        if (evaluateConditions(expression, x)) {
            validDomain.push(x);
        }
    }

    // Si el dominio es completo, devolver (-∞, ∞)
    if (validDomain.length === domain.length) {
        return "(-∞, ∞)";
    }

    // Convertir el resultado a una notación de intervalo
    let intervals = [];
    let start = validDomain[0];
    for (let i = 1; i < validDomain.length; i++) {
        if (validDomain[i] - validDomain[i - 1] > 1) {
            let end = validDomain[i - 1];
            intervals.push(`[${start === -100 ? "-∞" : start}, ${end === 100 ? "∞" : end}]`);
            start = validDomain[i];
        }
    }
    intervals.push(`[${start === -100 ? "-∞" : start}, ${validDomain[validDomain.length - 1] === 100 ? "∞" : validDomain[validDomain.length - 1]}]`);
    return intervals.join(" U ");
}

//=---=-=-=-=-=-=-=-= Función para mostrar la información en el contenedor HTML =-=--=-=-=-=-=-=
function showInfo(equation) {
    //-------------------------------------------------: (derivadas):---------------------------------------------
    try {
        const derivatives = derive(equation);

        // Usamos notación TeX para MathJax y envolvemos con delimitadores \( \)
        document.getElementById('derivative1').innerHTML = `Primera derivada: \\(${derivatives.firstDerivativeTeX}\\)`;
        document.getElementById('derivative2').innerHTML = `Segunda derivada: \\(${derivatives.secondDerivativeTeX}\\)`;

        // Actualizamos MathJax para renderizar las ecuaciones
        MathJax.typesetPromise().catch((err) => console.log("Error al renderizar MathJax:", err));

    } catch (error) {
        document.getElementById('derivative1').innerText = `Primera derivada: No se pudo calcular`;
        document.getElementById('derivative2').innerText = `Segunda derivada: No se pudo calcular`;
        console.error("Error en showInfo (derivatives)", error);
        alert("Error en showInfo (derivatives)", error);
    }
    //---------------------------------------------------derivadas fin----------------------------------------------
    //--------------------------------------------------: (Dominio) :----------------------------------------------
    try{
        const domain = calculateDomain(equation);
        document.getElementById('domain').innerText = `Dominio: ${domain}`;
    }catch(error){
        document.getElementById('domain').innerText = `Dominio: No se pudo calcular.`;
        console.error("Error en showInfo (domain)", error);
        alert("Error en showInfo (domain)", error);
    }//---------------------------------------------------Dominio fin------------------------------------------------
    //--------------------------------------------------: (Puntos críticos) :----------------------------------------------
    try{
        const criticalPoints = findCriticalPoints(equation);
        //document.getElementById('criticalPoints').innerText = 
            //`*Puntos máximos: (${criticalPoints.maxima.join(', ')}) \n*Puntos mínimos: (${criticalPoints.minima.join(', ')})`;

        document.getElementById('maximos').innerText = `Máximos: (${criticalPoints.maxima})`;
        document.getElementById('minimos').innerText = `Mínimos: (${criticalPoints.minima})`;
        //document.getElementById('asintotas').innerText = `Asintotas: (${criticalPoints.asymptotes})`;
        document.getElementById('inflexion').innerText = `Inflexion: (${criticalPoints.inflectionPoints})`;
        
    }catch(error){
        document.getElementById('maximos').innerText = `Puntos críticos: No se pudo calcular.`;
        console.error("Error en showInfo (puntos críticos)", error);
        alert("Error en showInfo (puntos críticos)", error);
    }//--------------------------------------------------Puntos críticos fin----------------------------------------------
}
//=---=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-=: END :=-=-=-=- =-=--=-=-=-=-=-=