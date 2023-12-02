import React, { useState, useEffect } from 'react';
import WarningIcon from '@mui/icons-material/Warning';
import './MissionPlanner.css';

const DesertMission = (props) => {
    // State for surveillance drone
    const [position, setPosition] = useState({ x: 202, y: 420 });
    const [path, setPath] = useState([]);
    const [showSurveillanceDrone, setShowSurveillanceDrone] = useState(true);
    const [returning, setReturning] = useState(false);

    // State for supply drone
    const [supplyDronePosition, setSupplyDronePosition] = useState({ x: 202, y: 420 });
    const [supplyPath, setSupplyPath] = useState([]);
    const [showSupplyDrone, setShowSupplyDrone] = useState(false);

    // State for air defense
    const [showAirDefense, setShowAirDefense] = useState(false);
    const [showThreatText, setShowThreatText] = useState(true);

    // Constants for positions
    const groundStation = { x: 202, y: 420 };
    const endPosition = { x: 1340, y: 356 };
    const airDefensePosition = { x: 915, y: 422 };
    const airDefenseRadius = 180;

    const [supplyDroneStage, setSupplyDroneStage] = useState(1);
    const [showMissionAccomplished, setShowMissionAccomplished] = useState(false);

    // Constants for supply drone destinations
    const northPointOfCircle = {
        x: airDefensePosition.x,
        y: airDefensePosition.y - airDefenseRadius - 80
    };

    const { handleTabChange } = props;

    useEffect(() => {
        const threatTextInterval = setInterval(() => {
            setShowThreatText(prev => !prev);
        }, 500);

        return () => clearInterval(threatTextInterval);
    }, []);

    useEffect(() => {
        // Check if surveillance drone has reached the ground station
        if (returning && position.x === groundStation.x && position.y === groundStation.y) {
            setShowSurveillanceDrone(false);  // Hide surveillance drone
            setShowSupplyDrone(true);        // Show supply drone
            setPath([]);                     // Clear the path of the surveillance drone
        }
    }, [returning, position]);

    useEffect(() => {
        const interval = setInterval(() => {
            setPosition(prevPosition => {
                const targetPosition = returning ? groundStation : endPosition;
                const direction = {
                    x: targetPosition.x - prevPosition.x,
                    y: targetPosition.y - prevPosition.y,
                };

                const distance = Math.sqrt(direction.x ** 2 + direction.y ** 2);
                if (distance < 3) {
                    if (returning) {
                        setShowSurveillanceDrone(false);
                        setShowSupplyDrone(true);
                        setPath([]);
                    }
                    return prevPosition;
                }

                const normalizedDirection = {
                    x: direction.x / distance,
                    y: direction.y / distance,
                };

                const speed = 20;
                const newPosition = {
                    x: prevPosition.x + normalizedDirection.x * speed,
                    y: prevPosition.y + normalizedDirection.y * speed,
                };

                if (!returning && Math.sqrt(
                    (newPosition.x - airDefensePosition.x) ** 2 +
                    (newPosition.y - airDefensePosition.y) ** 2
                ) <= airDefenseRadius + 61) {
                    setShowAirDefense(true);
                    setReturning(true);
                }

                setPath(prevPath => [...prevPath, newPosition]);
                return newPosition;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [showSurveillanceDrone, returning]);

    useEffect(() => {
        if (!showSupplyDrone) return;

        const supplyInterval = setInterval(() => {
            setSupplyDronePosition(prevPosition => {
                const currentTarget = supplyDroneStage === 1 ? northPointOfCircle : endPosition;
                const direction = {
                    x: currentTarget.x - prevPosition.x,
                    y: currentTarget.y - prevPosition.y,
                };

                var distance = Math.sqrt(direction.x ** 2 + direction.y ** 2);
                if (distance < 50) {
                    if (supplyDroneStage === 1) {
                        setSupplyDroneStage(2); // Move to the second stage (towards the supply destination)
                    } else {
                        // Optionally, stop the supply drone when it reaches the supply destination
                        clearInterval(supplyInterval);
                    }
                    return prevPosition; // Avoid overshooting the target
                }

                const normalizedDirection = {
                    x: direction.x / distance,
                    y: direction.y / distance,
                };

                const speed = 20;
                const newPosition = {
                    x: prevPosition.x + normalizedDirection.x * speed,
                    y: prevPosition.y + normalizedDirection.y * speed,
                };

                setSupplyPath(prevPath => [...prevPath, newPosition]);

                distance = Math.sqrt(
                    Math.pow(endPosition.x - prevPosition.x, 2) +
                    Math.pow(endPosition.y - prevPosition.y, 2)
                );

                if (distance < 80) {
                    setShowMissionAccomplished(true); // Show mission accomplished message
                    clearInterval(supplyInterval); // Stop the supply drone
                }

                return newPosition;
            });
        }, 1000);

        return () => clearInterval(supplyInterval);
    }, [showSupplyDrone, supplyDroneStage]);

    const missionAccomplishedStyle = {
        display: showMissionAccomplished ? 'block' : 'none',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'green',
        color: 'white',
        padding: '20px',
        borderRadius: '10px',
        textAlign: 'center',
        fontSize: '60px',
        zIndex: 1000,
        animation: 'fadeIn 2s forwards',
    };


    // Keyframes for fadeIn animation
    const keyframesStyle = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;


    const pathString = path.map(p => `${p.x},${p.y}`).join(' ');
    const supplyPathString = supplyPath.map(p => `${p.x},${p.y}`).join(' ');
    const searchlightPosition = {
        x: position.x + 30,
        y: position.y - 20
    };

    return (
        <><svg className="mission-svg"
            viewBox="0 0 1792 1024"
            preserveAspectRatio="xMidYMid meet">
            <image href="desert.png" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
            <image href="groundControl.png" x="202" y="420" width="70" height="70" />
            <rect x="177" y="500" width="150" height="30" fill="black" stroke="white" strokeWidth="2" rx="15" ry="15" />
            <text x="252" y="520" fill="white" fontSize="15" textAnchor="middle" fontWeight="bold">Ground Station</text>
            <image href="soldier.png" x="1340" y="356" width="70" height="70" />
            <rect x="1315" y="436" width="150" height="30" fill="black" stroke="white" strokeWidth="2" rx="15" ry="15" />
            <text x="1390" y="456" fill="white" fontSize="15" textAnchor="middle" fontWeight="bold">Supply Destination</text>

            {showSurveillanceDrone && (
                <>
                    <polyline points={pathString} fill="none" stroke="green" strokeWidth="2" strokeDasharray="5,5" />
                    <image href="drone.png" x={position.x} y={position.y} width="70" height="70" />
                    <image href="searchlight.png" x={searchlightPosition.x + 20} y={searchlightPosition.y} width="90" height="90" />
                    <rect x={position.x - 25} y={position.y + 60} width="150" height="30" fill="black" stroke="white" strokeWidth="2" rx="15" ry="15" />
                    <text x={position.x + 50} y={position.y + 80} fill="white" fontSize="15" textAnchor="middle" fontWeight="bold">Surveillance Drone</text>
                </>
            )}

            {showSupplyDrone && (
                <>
                    <polyline points={supplyPathString} fill="none" stroke="blue" strokeWidth="2" strokeDasharray="5,5" />
                    <image href="supplydrone.png" x={supplyDronePosition.x} y={supplyDronePosition.y} width="70" height="70" />
                    <rect x={supplyDronePosition.x - 25} y={supplyDronePosition.y + 60} width="150" height="30" fill="black" stroke="white" strokeWidth="2" rx="15" ry="15" />
                    <text x={supplyDronePosition.x + 50} y={supplyDronePosition.y + 80} fill="white" fontSize="15" textAnchor="middle" fontWeight="bold">Supply Drone</text>
                </>
            )}

            {showAirDefense && (
                <>
                    <circle cx={airDefensePosition.x} cy={airDefensePosition.y} r={airDefenseRadius} fill="rgba(255,192,203,0.5)" stroke="red" strokeWidth="2" strokeDasharray="10,5" />
                    <image href="airdefense.png" x={airDefensePosition.x - 25} y={airDefensePosition.y - 25} width="70" height="70" />
                    <rect x={airDefensePosition.x - 25} y={airDefensePosition.y + airDefenseRadius - 10} width="150" height="30" fill="black" stroke="white" strokeWidth="2" rx="15" ry="15" />
                    <text x={airDefensePosition.x + 50} y={airDefensePosition.y + airDefenseRadius + 12} fill="white" fontSize="15" textAnchor="middle" fontWeight="bold">Enemy Air Defense</text>
                    {showThreatText && (
                        <text x={airDefensePosition.x} y={airDefensePosition.y + airDefenseRadius + 50} fill="red" fontSize="20" textAnchor="middle" fontWeight="bold">
                            ⚠️ Threat Detected!
                        </text>
                    )}

                </>
            )}
        </svg>
            {showMissionAccomplished && (
                <div style={missionAccomplishedStyle}>
                    <button
                        className="close-button"
                        style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            backgroundColor: 'transparent',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '20px',
                            zIndex: 1001, // Ensure it's above the success message
                        }}
                        onClick={() => {
                            setShowMissionAccomplished(false);
                            handleTabChange('Select Mission Type');
                        }}
                    >
                        X
                    </button>

                    Mission Accomplished! Supplies Have Been Delivered!
                </div>
            )}
        </>
    );
};

export default DesertMission;