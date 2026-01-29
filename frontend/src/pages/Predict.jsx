import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import PredictionForm from '../components/PredictionForm';
import RaceCard from '../components/RaceCard';
import { getRaces, getDrivers, getPredictions, savePrediction } from '../lib/api';

function Predict() {
  const { raceId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const [race, setRace] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [existingPrediction, setExistingPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Parse raceId (format: "2024_1")
  const [year, round] = raceId ? raceId.split('_') : [null, null];

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    fetchData();
  }, [raceId, currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get race from local data
      const races = getRaces(parseInt(year));
      const raceData = races.find(r => r.round === parseInt(round));
      setRace(raceData);

      // Get drivers from local data
      const driversData = getDrivers();
      setDrivers(driversData);

      // Check for existing prediction in Supabase
      if (currentUser) {
        try {
          const predictions = await getPredictions(raceId, currentUser.id);
          if (predictions && predictions.length > 0) {
            setExistingPrediction(predictions[0]);
          }
        } catch (error) {
          // No existing prediction, that's fine
          console.log('No existing prediction found');
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load race data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    if (!currentUser) {
      setMessage({ type: 'error', text: 'Please select a user first' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await savePrediction({
        userId: currentUser.id,
        raceId,
        raceYear: parseInt(year),
        raceRound: parseInt(round),
        ...formData
      });

      setMessage({ type: 'success', text: 'Prediction saved successfully!' });

      // Refresh existing prediction
      const predictions = await getPredictions(raceId, currentUser.id);
      if (predictions && predictions.length > 0) {
        setExistingPrediction(predictions[0]);
      }
    } catch (error) {
      console.error('Error saving prediction:', error);
      setMessage({ type: 'error', text: 'Failed to save prediction' });
    } finally {
      setSaving(false);
    }
  };

  // Check if predictions are locked
  const isLocked = () => {
    if (!race) return false;
    const qualifyingDate = race.qualifyingDate
      ? new Date(`${race.qualifyingDate}T${race.qualifyingTime || '14:00:00Z'}`)
      : new Date(`${race.date}T${race.time || '14:00:00Z'}`);
    return new Date() > qualifyingDate;
  };

  if (!currentUser) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-400">Please select a user to make predictions</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-f1-red"></div>
      </div>
    );
  }

  if (!race) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-400">Race not found</p>
      </div>
    );
  }

  // Transform existing prediction to form format
  const initialValues = existingPrediction ? {
    p1: existingPrediction.p1 || '',
    p2: existingPrediction.p2 || '',
    p3: existingPrediction.p3 || '',
    top10: existingPrediction.top_10 || existingPrediction.top10 || [],
    fastestLap: existingPrediction.fastest_lap || existingPrediction.fastestLap || '',
    polePosition: existingPrediction.pole_position || existingPrediction.polePosition || '',
    dnfDrivers: existingPrediction.dnf_drivers || existingPrediction.dnfDrivers || [],
    safetyCar: existingPrediction.safety_car ?? existingPrediction.safetyCar ?? false,
    redFlag: existingPrediction.red_flag ?? existingPrediction.redFlag ?? false,
    driverOfTheDay: existingPrediction.driver_of_the_day || existingPrediction.driverOfTheDay || '',
    winningMarginBracket: existingPrediction.winning_margin_bracket || existingPrediction.winningMarginBracket || ''
  } : {};

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Make Prediction</h1>
        <div className="flex items-center space-x-2">
          <span className="text-xl">{currentUser.emoji}</span>
          <span className="text-gray-400">{currentUser.name}</span>
        </div>
      </div>

      {/* Race Info */}
      <RaceCard race={race} showPredictButton={false} />

      {/* Status Messages */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {existingPrediction && !isLocked() && (
        <div className="p-4 bg-blue-900/50 text-blue-200 rounded-lg">
          You have an existing prediction for this race. Any changes will update it.
        </div>
      )}

      {/* Prediction Form */}
      <PredictionForm
        drivers={drivers}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        isLocked={isLocked()}
      />

      {saving && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-f1-gray p-6 rounded-lg flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-f1-red"></div>
            <span>Saving prediction...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Predict;
