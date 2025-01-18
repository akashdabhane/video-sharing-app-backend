const formatVideoDuration = (seconds) => {
    // Calculate hours, minutes, and remaining seconds
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    // Format the time string with leading zeros
    const formattedTime = [
        hours > 0 ? String(hours).padStart(2, '0') : null, // Include hours only if greater than 0
        String(minutes).padStart(2, '0'),
        String(remainingSeconds).padStart(2, '0')
    ].filter(Boolean).join(':'); // Filter out null values

    return formattedTime;
}

export default formatVideoDuration;