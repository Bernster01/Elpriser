let areaCode;
let shouldPrint;
function printPage() {

    const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
    //Scale page to 90% for better printing in Safari
    if (isSafari) {
        document.body.style.zoom = "90%";
    }
    window.print();
    //Reset zoom to 100% after printing
    if (isSafari) {
        document.body.style.zoom = "100%";
    }
}
async function getElectricityPrice(date) {
    try {
        const dates = getDate(date);
        const url = `https://www.elprisetjustnu.se/api/v1/prices/${dates.year}/${dates.month}-${dates.day}_${areaCode}.json`;
        console.log(url);
        return fetch(url)
            .then(response => response.json())
            .then(data => data)
            .catch(error => {
                console.error("Error fetching electricity price:", error);
                throw error;  // Rethrow error for further handling if needed
            });
    } catch (error) {
        return error;
    }
}
function getDate(useDate) {
    let date;
    if (useDate) {
        date = new Date(useDate);
    } else {
        date = new Date();
        date.setDate(date.getDate() + 1);
    }
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    //day and month should have leading zeros if they are less than 10
    if (month < 10) {
        month = `0${month}`;
    }
    if (day < 10) {
        day = `0${day}`;
    }
    return { year, month, day };
}
function changeAreaCode() {
    areaCode = prompt("Ange ditt elområde (SE1, SE2, SE3, SE4) för att få korrekta priser. Ditt elområde hittar du på din elräkning.");
    areaCode = areaCode.toUpperCase();
    if (areaCode === "SE1" || areaCode === "SE2" || areaCode === "SE3" || areaCode === "SE4") {
        localStorage.setItem("areaCode", areaCode);
        location.reload();
    }
    else {
        alert("Områdesnumret är inte giltigt. Försök igen.");
    }
}
function getHighestPrice(electricity) {
    const prices = electricity.prices;
    const highestPrice = Math.max(...prices);
    return highestPrice;
}
function getAveragePrice(electricity) {
    const prices = electricity.prices;
    const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    return Math.round(averagePrice * 100) / 100;
}
function getLowestPrice(electricity) {
    const prices = electricity.prices;
    const lowestPrice = Math.min(...prices);
    return lowestPrice;
}
async function main() {

    //Check local storage for area code
    areaCode = localStorage.getItem("areaCode");
    // shouldPrint = localStorage.getItem("shouldPrint");
    if (!areaCode) {
        areaCode = prompt("Ange ditt elområde (SE1, SE2, SE3, SE4) för att få korrekta priser. Ditt elområde hittar du på din elräkning.");
        console.log(areaCode);
        if (areaCode === null) {
            confirm("Du måste ange ett område för att kunna se elpriserna.");
            location.reload();
        }
        //Check if area code is valid
        areaCode = areaCode.toUpperCase();
        if (areaCode === "SE1" || areaCode === "SE2" || areaCode === "SE3" || areaCode === "SE4") {
            localStorage.setItem("areaCode", areaCode);
        }
        else {
            alert("Områdesnumret är inte giltigt. Försök igen.");
            location.reload();
        }

    }
    // if (!shouldPrint) {
    //     shouldPrint = confirm("Vill du automatiskt skriva ut sidan när du landar på startsidan?");
    //     localStorage.setItem("shouldPrint", shouldPrint);
    // }
    console.log(shouldPrint);
    let electricityPriceJson;
    //check for get request in url
    const urlParams = new URLSearchParams(window.location.search);
    const myParam = urlParams.get('date');
    //Check for what browser is used
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
    if (!isChrome && !myParam) {
        alert("Utskrift fungerar bäst i chrome. Du kan behöva skala om sidan (till ca. 90%) i förinställningarna innan du skriver ut.");
    }

    let dates
    if (myParam) {
        dates = getDate(myParam);
    }
    else {
        dates = getDate();
    }
    const yesterday = new Date(dates.year, dates.month - 1, dates.day);
    yesterday.setDate(yesterday.getDate() - 1);
    // document.getElementById("previous_day").href = `index.html?date=${yesterday}-${yesterday.month}-${yesterday.day}`;
    let yesterdayDay = yesterday.getDate();
    //Add leading zero if day is less than 10
    if (yesterdayDay < 10) {
        yesterdayDay = `0${yesterdayDay}`;
    }
    document.getElementById("previous_day").href = `index.html?date=${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterdayDay}`;
    newDate = new Date(dates.year, dates.month - 1, dates.day);

    newDate = getDate(newDate);
    const tomorrow = new Date(newDate.year, newDate.month - 1, newDate.day);
    tomorrow.setDate(tomorrow.getDate() + 1);
    let tomorrowDay = tomorrow.getDate();
    //Add leading zero if day is less than 10
    if (tomorrowDay < 10) {
        tomorrowDay = `0${tomorrowDay}`;
    }
    // document.getElementById("next_day").href = `index.html?date=${tomorrow}-${tomorrow.month}-${tomorrow.day}`;
    document.getElementById("next_day").href = `index.html?date=${tomorrow.getFullYear()}-${tomorrow.getMonth() + 1}-${tomorrowDay}`;
    try {
        if (myParam) {
            electricityPriceJson = await getElectricityPrice(myParam);
        }
        else {

            electricityPriceJson = await getElectricityPrice();
        }
    } catch (error) {
        alert("Priserna finns inte tillgängliga för nästa dag. Försök igen senare.");
        window.location.href = "index.html";
        return;
    }

    let electricity = { dates: [], prices: [] };
    for (let i of electricityPriceJson) {
        electricity.prices.push(Math.round(Number.parseFloat(i.SEK_per_kWh * 1.25 * 100) * 100) / 100);
        let date = new Date(i.time_start);
        let hours = date.getHours();
        let minutes = date.getMinutes();
        if (hours < 10) {
            hours = `0${hours}`;
        }
        electricity.dates.push(`${hours}:00`);
    }
    console.log(electricity);

    document.getElementById("date_span").innerText = `${dates.year}-${dates.month}-${dates.day} (${areaCode})`;
    const highestPrice = getHighestPrice(electricity);
    const averagePrice = getAveragePrice(electricity);
    const lowestPrice = getLowestPrice(electricity);
    document.getElementById("highest").innerText = highestPrice;
    document.getElementById("average").innerText = averagePrice;
    document.getElementById("lowest").innerText = lowestPrice;
    appendElectricityPrice(electricity);
    //go back one day to get the average price for the month
    const aDate = new Date(dates.year, dates.month - 1, dates.day);
    const monthAverage = await getMonthAverage(aDate);
    setBackgroundColorForPrices(lowestPrice, averagePrice, highestPrice, monthAverage);
    const lowest = document.getElementById("lowest")
    const average = document.getElementById("average")
    const highest = document.getElementById("highest")
    if (lowestPrice > monthAverage) {
        lowest.parentElement.classList.add("above_month_average");
    }
    else {
        lowest.parentElement.classList.add("below_month_average");
    }
    if (averagePrice > monthAverage) {
        average.parentElement.classList.add("above_month_average");
    }
    else {
        average.parentElement.classList.add("below_month_average");
    }
    if (highestPrice > monthAverage) {
        highest.parentElement.classList.add("above_month_average");
    }
    else {
        highest.parentElement.classList.add("below_month_average");
    }
    if (lowestPrice > 300) {//breakpoint for high prices as butan gas is cheaper
        lowest.parentElement.classList.add("danger");
    }
    if (averagePrice > 300) {//breakpoint for high prices as butan gas is cheaper
        average.parentElement.classList.add("danger");
    }
    if (highestPrice > 300) {//breakpoint for high prices as butan gas is cheaper
        highest.parentElement.classList.add("danger");
    }
    //Show when you can shower
    const times = whenCanYouShower(averagePrice, monthAverage, electricity.prices);
    //Add shower class to the times you can shower
    const container1 = document.getElementById("left_column");
    const container2 = document.getElementById("right_column");
    for (let i of container1.children) {
        console.log(i.children[0].innerText);
        if (times.includes(i.children[0].innerText)) {
            i.classList.add("shower");
        }
    }
    for (let i of container2.children) {
        if (times.includes(i.children[0].innerText)) {
            i.classList.add("shower");
        }
    }
    //print to printer
    if (!myParam && shouldPrint === "true") {
        setTimeout(() => {
            printPage();
        }, 2000);
    }
}
function appendElectricityPrice(electricity) {
    const container1 = document.getElementById("left_column");
    const container2 = document.getElementById("right_column");
    let counter = 0;
    for (let i in electricity.prices) {
        const div = document.createElement("div");
        const time = document.createElement("span");
        const price = document.createElement("span");
        console.log(i);
        time.innerText = electricity.dates[i] + ": ";
        price.innerText = electricity.prices[i] + " öre";
        div.appendChild(time);
        div.appendChild(price);
        if (counter < 12) {
            container1.appendChild(div);
        }
        else {
            container2.appendChild(div);
        }
        counter++;
    }
}
async function setBackgroundColorForPrices(low, average, high, monthAverage) {

    let container = document.getElementById("left_column");
    setColor(low, average, high, monthAverage, container);
    container = document.getElementById("right_column");
    setColor(low, average, high, monthAverage, container);
   
}
function setColor(low,average,high,monthAverage,container){
    for (let i of container.children) {
        let price = i.children[1].innerText;
        price = Number.parseFloat(price);
        const parseRGB = (rgbString) => {
            const match = rgbString.match(/\d+/g);
            return match ? match.map(Number) : [0, 0, 0];
        }
        let startPoint = "rgb(123, 245, 123)";
        let middlePoint = "rgb(255, 205, 112)";
        let maxPoint = "rgb(255, 87, 87)";
        let lowest = low;
        let highest = high;
        let averagePrice = average;
        const startRGB = parseRGB(startPoint);
        const middleRGB = parseRGB(middlePoint);
        const maxRGB = parseRGB(maxPoint);

        let gradient = (price - lowest) / (highest - lowest);
        gradient = Math.max(0, Math.min(1, gradient)); // Clamp the gradient between 0 and 1

        let color;
        if (gradient <= 0.5) {
            // Interpolate between start and middle
            const localGradient = gradient / 0.5; // Scale to range [0, 1]
            color = `rgb(
        ${Math.round((1 - localGradient) * startRGB[0] + localGradient * middleRGB[0])},
        ${Math.round((1 - localGradient) * startRGB[1] + localGradient * middleRGB[1])},
        ${Math.round((1 - localGradient) * startRGB[2] + localGradient * middleRGB[2])}
    )`;
        } else {
            // Interpolate between middle and max
            const localGradient = (gradient - 0.5) / 0.5; // Scale to range [0, 1]
            color = `rgb(
        ${Math.round((1 - localGradient) * middleRGB[0] + localGradient * maxRGB[0])},
        ${Math.round((1 - localGradient) * middleRGB[1] + localGradient * maxRGB[1])},
        ${Math.round((1 - localGradient) * middleRGB[2] + localGradient * maxRGB[2])}
    )`;
        }
        i.style.backgroundColor = color;
        //Set background color based on price according to what it is closest to (low, average, high)
        const diffLow = Math.abs(price - low);
        const diffAverage = Math.abs(price - average);
        const diffHigh = Math.abs(price - high);




        // Set the background color based on the closest reference value
        if (diffLow <= diffAverage && diffLow <= diffHigh) {
            // i.classList.add("low") // Low price
            if (price === low) {
                i.children[0].classList.add("lowest_underline");
                i.children[1].classList.add("lowest_underline");
            }
        } else if (diffAverage < diffLow && diffAverage <= diffHigh) {
            // i.classList.add("medium")  // Average price
            if (price < average) {
                i.children[0].classList.add("low_underline");
                i.children[1].classList.add("low_underline");
            }
            else {
                i.children[0].classList.add("high_underline");
                i.children[1].classList.add("high_underline");
            }
        } else {
            // i.classList.add("high") // High price
            if (price === high) {
                i.children[0].classList.add("highest_underline");
                i.children[1].classList.add("highest_underline");
            }
        }

        if ((price * 1.1) > monthAverage) {
            i.classList.add("above_month_average");
        }
        else {
            i.classList.add("below_month_average");
        }
        if (price > 300) {//breakpoint for high prices as butan gas is cheaper
            i.classList.add("danger");
        }

    }
}
async function getMonthAverage(startDate) {
    const date = startDate ? new Date(startDate) : new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensure two digits
    const year = date.getFullYear();
    const days = Array.from({ length: date.getDate() }, (_, i) => String(i + 1).padStart(2, '0')); // Days with leading zero
    console.log(startDate);
    let prices = [];
    try {
        const fetchPromises = days.map(day => {
            const url = `https://www.elprisetjustnu.se/api/v1/prices/${year}/${month}-${day}_${areaCode}.json`;
            return fetch(url)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    const prices = data.map(price => price.SEK_per_kWh * 1.25 * 100); // Convert to SEK/kWh and add VAT
                    return prices.reduce((sum, price) => sum + price, 0) / prices.length; // Calculate average
                });
        });

        prices = await Promise.all(fetchPromises); // Wait for all promises to resolve

        const validPrices = prices.filter(price => price != null); // Filter out null/undefined prices
        const average = validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;

        return average;
    } catch (error) {
        console.error("Error fetching electricity prices:", error);
    }
}
function whenCanYouShower(average, monthAverage, prices) {
    const times = [];
    for (let i in prices) {
        const breakpoint = (average > monthAverage) ? average : monthAverage;
        if (prices[i] <= breakpoint) {
            //Turn index into a time 0 => 00:00, 1 => 01:00, 2 => 02:00 etc.
            let time = Number.parseInt(i);
            if (time < 10) {
                time = `0${time}`;
            }
            times.push(`${time}:00:`);
        }
    }
    const timesCold = [];
    for (let i in prices) {
        let breakpoint = (average > monthAverage) ? average : monthAverage;
        breakpoint = breakpoint * 1.2;
        if (prices[i] > breakpoint) {
            //Turn index into a time 0 => 00:00, 1 => 01:00, 2 => 02:00 etc.
            let time = Number.parseInt(i);
            if (time < 10) {
                time = `0${time}`;
            }
            timesCold.push(`${time}:00:`);
        }
    }
    const bestTimes = [6, 18, 20];
    return times;
}
main();