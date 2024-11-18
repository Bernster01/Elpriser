async function getElectricityPrice() {
    try {
        const dates = getDate();
        const url = `https://www.elprisetjustnu.se/api/v1/prices/${dates.year}/${dates.month}-${dates.day}_SE3.json`;
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
function getDate() {
    //get the next day date
    let date = new Date();
    date.setDate(date.getDate() + 1);
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
    let electricityPriceJson;
    try {
        electricityPriceJson = await getElectricityPrice();
    } catch (error) {
        alert("Priserna finns inte tillgängliga för nästa dag. Försök igen senare.");
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
    const dates = getDate();
    document.getElementById("date_span").innerText = `${dates.year}-${dates.month}-${dates.day}`;
    const highestPrice = getHighestPrice(electricity);
    const averagePrice = getAveragePrice(electricity);
    const lowestPrice = getLowestPrice(electricity);
    document.getElementById("highest").innerText = highestPrice;
    document.getElementById("average").innerText = averagePrice;
    document.getElementById("lowest").innerText = lowestPrice;
    appendElectricityPrice(electricity);
    setBackgroundColorForPrices(lowestPrice, averagePrice, highestPrice);
    //print to printer
    // window.print();
}
function appendElectricityPrice(electricity) {
    const container = document.getElementById("electricity_prices");
    for (let i of electricity.prices) {
        const div = document.createElement("div");
        const time = document.createElement("span");
        const price = document.createElement("span");
        time.innerText = electricity.dates[electricity.prices.indexOf(i)] + ": ";
        price.innerText = i + " öre";
        div.appendChild(time);
        div.appendChild(price);
        container.appendChild(div);
    }
}
async function setBackgroundColorForPrices(low, average, high) {

    const container = document.getElementById("electricity_prices");
    for (let i of container.children) {
        let price = i.children[1].innerText;
        price = Number.parseFloat(price);

        //Set background color based on price according to what it is closest to (low, average, high)
        const diffLow = Math.abs(price - low);
        const diffAverage = Math.abs(price - average);
        const diffHigh = Math.abs(price - high);
        const monthAverage = await getMonthAverage();
        // Set the background color based on the closest reference value
        if (diffLow <= diffAverage && diffLow <= diffHigh) {
            i.classList.add("low") // Low price
            if(price === low){
                i.children[0].classList.add("lowest_underline");
                i.children[1].classList.add("lowest_underline");
            }
        } else if (diffAverage < diffLow && diffAverage <= diffHigh) {
            i.classList.add("medium")  // Average price
            if (price < average) {
                i.children[0].classList.add("low_underline");
                i.children[1].classList.add("low_underline");
            }
            else {
                i.children[0].classList.add("high_underline");
                i.children[1].classList.add("high_underline");
            }
        } else {
            i.classList.add("high") // High price
            if(price === high){
                i.children[0].classList.add("highest_underline");
                i.children[1].classList.add("highest_underline");
            }
        }
        console.log(price,monthAverage);
        console.log(price > monthAverage);
        
        if((price *1.1) > monthAverage){
            i.classList.add("above_month_average");
        }
        else{
            i.classList.add("below_month_average");
        }
        

    }
}
async function getMonthAverage() {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensure two digits
    const year = date.getFullYear();
    const days = Array.from({ length: date.getDate() }, (_, i) => String(i + 1).padStart(2, '0')); // Days with leading zero

    let prices = [];

    try {
        const fetchPromises = days.map(day => {
            const url = `https://www.elprisetjustnu.se/api/v1/prices/${year}/${month}-${day}_SE3.json`;
            return fetch(url)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    const prices = data.map(price => price.SEK_per_kWh * 1.25*100); // Convert to SEK/kWh and add VAT
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
main();