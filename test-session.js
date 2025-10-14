// Test-Daten für Session-Statistik
const testSessionData = {
    plannedMinutes: 60,
    actualMinutes: 45,
    differenceMinutes: 15,
    timestamp: Date.now()
};

localStorage.setItem('lastSessionData', JSON.stringify(testSessionData));
console.log('Test session data saved:', testSessionData);
console.log('Reload the page to see the session stats in the header');
