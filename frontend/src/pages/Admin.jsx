import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import {
  getRaces,
  getDrivers,
  getRaceResult,
  fetchRaceResultsFromAPI,
  updateRaceResultManualData,
  calculateAndSaveScores,
  sendTestEmailToUser,
  triggerNotificationCheck,
  getRacePot,
  togglePlayerPaid,
  payOutWinners,
  calcPot,
  getRaceLeaderboard,
  sendPaymentConfirmationEmail,
  autoFetchRaceResults
} from '../lib/api';

function Admin() {
  const { currentUser, isHost, users, updateUser } = useUser();
  const [activeTab, setActiveTab] = useState('races');
  const [races, setRaces] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedRace, setSelectedRace] = useState(null);
  const [raceResult, setRaceResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [manualInputs, setManualInputs] = useState({
    safetyCar: false,
    redFlag: false,
    driverOfTheDay: ''
  });
  // Pot state
  const [pot, setPot] = useState(null);
  const [potRace, setPotRace] = useState(null);
  const [potLoading, setPotLoading] = useState(false);
  const [potMessage, setPotMessage] = useState(null);
  const [raceScores, setRaceScores] = useState([]);

  // Participants state
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [editingEmail, setEditingEmail] = useState(false);
  const [participantEmail, setParticipantEmail] = useState('');
  const [participantMessage, setParticipantMessage] = useState(null);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  useEffect(() => {
    fetchRaces();
  }, []);

  useEffect(() => {
    if (selectedRace) {
      fetchRaceResult(selectedRace);
    }
  }, [selectedRace]);

  const fetchRaces = async () => {
    try {
      // Get races from local data
      const raceData = getRaces(2026);
      // Sort by date descending to show most recent first
      const sortedRaces = [...raceData].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
      setRaces(sortedRaces);

      // Get drivers for dropdown
      const driverData = getDrivers();
      setDrivers(driverData);
    } catch (error) {
      console.error('Error fetching races:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRaceResult = async (race) => {
    const raceId = `${new Date(race.date).getFullYear()}_${race.round}`;
    try {
      const result = await getRaceResult(raceId);
      setRaceResult(result);
      if (result) {
        setManualInputs({
          safetyCar: result.safety_car || false,
          redFlag: result.red_flag || false,
          driverOfTheDay: result.driver_of_the_day || ''
        });
      } else {
        setManualInputs({ safetyCar: false, redFlag: false, driverOfTheDay: '' });
      }
    } catch (error) {
      setRaceResult(null);
      setManualInputs({ safetyCar: false, redFlag: false, driverOfTheDay: '' });
    }
  };

  const fetchResults = async () => {
    if (!selectedRace) return;

    setActionLoading(true);
    setMessage(null);

    const raceId = `${new Date(selectedRace.date).getFullYear()}_${selectedRace.round}`;

    try {
      const result = await autoFetchRaceResults(raceId);
      if (result.fetched) {
        setMessage({
          type: 'success',
          text: `Results fetched & scores calculated for ${result.scored} prediction(s)! Refresh to see results.`
        });
        fetchRaceResult(selectedRace);
      } else {
        setMessage({
          type: 'error',
          text: result.message || 'Results not available from OpenF1 yet. Try again after the race finishes.'
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to fetch results' });
    } finally {
      setActionLoading(false);
    }
  };

  const updateManualData = async () => {
    if (!selectedRace || !raceResult) return;

    setActionLoading(true);
    setMessage(null);

    const raceId = `${new Date(selectedRace.date).getFullYear()}_${selectedRace.round}`;

    try {
      await updateRaceResultManualData(raceId, {
        safety_car: manualInputs.safetyCar,
        red_flag: manualInputs.redFlag,
        driver_of_the_day: manualInputs.driverOfTheDay || null
      });

      setMessage({ type: 'success', text: 'Race data updated!' });
      fetchRaceResult(selectedRace);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update race data' });
    } finally {
      setActionLoading(false);
    }
  };

  const calculateScores = async () => {
    if (!selectedRace) return;

    setActionLoading(true);
    setMessage(null);

    const raceId = `${new Date(selectedRace.date).getFullYear()}_${selectedRace.round}`;

    try {
      const result = await calculateAndSaveScores(raceId);
      setMessage({
        type: 'success',
        text: `Scores calculated for ${result.scoresCalculated} predictions!`
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to calculate scores'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const isPastRace = (race) => new Date(race.date) < new Date();

  const loadPotForRace = async (race) => {
    if (!race) return;
    setPotLoading(true);
    setPotMessage(null);
    const raceId = `${new Date(race.date).getFullYear()}_${race.round}`;
    try {
      const [potData, scores] = await Promise.all([
        getRacePot(raceId),
        isPastRace(race) ? getRaceLeaderboard(raceId) : Promise.resolve([])
      ]);
      setPot(potData);
      setRaceScores(scores);
      setPotRace(race);
    } catch (err) {
      console.error(err);
    } finally {
      setPotLoading(false);
    }
  };

  const handleTogglePaid = async (userId) => {
    if (!potRace) return;
    const raceId = `${new Date(potRace.date).getFullYear()}_${potRace.round}`;
    const currentPaidIds = pot?.paid_user_ids || [];
    const wasUnpaid = !currentPaidIds.includes(userId);
    try {
      const updated = await togglePlayerPaid(raceId, potRace.raceName, userId, currentPaidIds);
      setPot(updated);
      // Send confirmation email if player was just marked as paid
      if (wasUnpaid) {
        const user = users.find(u => u.id === userId);
        if (user?.email) {
          const newPaidCount = (updated.paid_user_ids || []).length;
          const { prizePool } = calcPot(newPaidCount);
          sendPaymentConfirmationEmail(user.email, user.name, user.emoji, potRace.raceName, prizePool)
            .then(() => setPotMessage({ type: 'success', text: `Marked paid & emailed ${user.name}!` }))
            .catch(() => setPotMessage({ type: 'success', text: `Marked paid (email failed for ${user.name})` }));
        } else {
          setPotMessage({ type: 'success', text: 'Payment recorded (no email on file)' });
        }
      }
    } catch (err) {
      setPotMessage({ type: 'error', text: 'Failed to update payment' });
    }
  };

  const handlePayOut = async () => {
    if (!potRace || raceScores.length === 0) return;
    const paidIds = pot?.paid_user_ids || [];
    const paidCount = paidIds.length;
    if (paidCount === 0) {
      setPotMessage({ type: 'error', text: 'No players have paid in yet' });
      return;
    }
    const topScore = raceScores[0]?.total_points;
    const winners = raceScores.filter(s => s.total_points === topScore && paidIds.includes(s.user_id));
    if (winners.length === 0) {
      setPotMessage({ type: 'error', text: 'No paid players have scores yet. Calculate scores first.' });
      return;
    }
    const { prizePerWinner } = calcPot(paidCount, winners.length);
    const raceId = `${new Date(potRace.date).getFullYear()}_${potRace.round}`;
    try {
      const updated = await payOutWinners(raceId, winners.map(w => w.user_id), prizePerWinner);
      setPot(updated);
      setPotMessage({ type: 'success', text: `Paid out $${prizePerWinner.toFixed(2)} to ${winners.length} winner${winners.length > 1 ? 's' : ''}!` });
    } catch (err) {
      setPotMessage({ type: 'error', text: 'Failed to record payout' });
    }
  };

  const selectedParticipantData = users.find(u => u.id === selectedParticipant);

  const handleSelectParticipant = (userId) => {
    setSelectedParticipant(userId);
    const user = users.find(u => u.id === userId);
    setParticipantEmail(user?.email || '');
    setEditingEmail(false);
    setParticipantMessage(null);
  };

  const handleSaveParticipantEmail = async (e) => {
    e.preventDefault();
    if (!selectedParticipant) return;
    try {
      await updateUser(selectedParticipant, {
        email: participantEmail || null,
        notify_qualifying: !!participantEmail
      });
      setEditingEmail(false);
      setParticipantMessage({ type: 'success', text: 'Email saved!' });
    } catch {
      setParticipantMessage({ type: 'error', text: 'Failed to save email' });
    }
  };

  const handleSendTestEmail = async () => {
    if (!selectedParticipantData?.email) return;
    setSendingTestEmail(true);
    setParticipantMessage(null);
    try {
      await sendTestEmailToUser(selectedParticipantData.email, selectedParticipantData.name);
      setParticipantMessage({ type: 'success', text: 'Welcome email sent!' });
    } catch (err) {
      setParticipantMessage({ type: 'error', text: err.message || 'Failed to send email' });
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleTriggerNotifications = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      await triggerNotificationCheck();
      setMessage({ type: 'success', text: 'Notification check triggered!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to trigger notifications' });
    } finally {
      setActionLoading(false);
    }
  };

  // Redirect non-host users
  if (!currentUser) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-400">Please select a user first</p>
      </div>
    );
  }

  if (!isHost) {
    return (
      <div className="card text-center py-8">
        <svg className="w-16 h-16 mx-auto text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V9a4 4 0 00-8 0v4h8zM5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2" />
        </svg>
        <h2 className="text-xl font-bold mb-2">Host Access Required</h2>
        <p className="text-gray-400">Only hosts can access the admin dashboard.</p>
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700">
        {[
          { id: 'races', label: '🏁 Race Results' },
          { id: 'pot', label: '💰 Prize Pot' },
          { id: 'participants', label: '👥 Participants & Emails' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-f1-red text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Prize Pot Tab */}
      {activeTab === 'pot' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Race selector */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Select Race</h2>
            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {races.map(race => (
                <button
                  key={race.round}
                  onClick={() => loadPotForRace(race)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    potRace?.round === race.round ? 'bg-f1-red text-white' : 'bg-f1-dark hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">R{race.round}: {race.raceName}</span>
                      <p className="text-sm opacity-75">{race.date}</p>
                    </div>
                    {isPastRace(race)
                      ? <span className="text-xs bg-gray-700 px-2 py-1 rounded">Past</span>
                      : <span className="text-xs bg-green-700 px-2 py-1 rounded">Upcoming</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Pot management */}
          <div className="space-y-4">
            {potMessage && (
              <div className={`p-3 rounded text-sm ${potMessage.type === 'success' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
                {potMessage.text}
              </div>
            )}

            {potRace ? (
              <>
                {/* Summary */}
                {(() => {
                  const paidIds = pot?.paid_user_ids || [];
                  const paidCount = paidIds.length;
                  const { totalCollected, hostTotal, prizePool } = calcPot(paidCount);
                  const isPaidOut = pot?.status === 'paid_out';
                  return (
                    <>
                      <div className="card">
                        <h3 className="font-semibold mb-1">{potRace.raceName}</h3>
                        <p className="text-xs text-gray-400 mb-4">$10/player · $9 to prize pool · $1 to developer</p>

                        <div className="grid grid-cols-3 gap-3 text-center mb-4">
                          <div className="bg-f1-dark rounded-lg p-3">
                            <p className="text-xs text-gray-500">Collected</p>
                            <p className="text-xl font-bold text-white">${totalCollected.toFixed(0)}</p>
                          </div>
                          <div className="bg-f1-dark rounded-lg p-3">
                            <p className="text-xs text-gray-500">Prize Pool</p>
                            <p className="text-xl font-bold text-yellow-400">${prizePool.toFixed(0)}</p>
                          </div>
                          <div className="bg-f1-dark rounded-lg p-3">
                            <p className="text-xs text-gray-500">Your Cut</p>
                            <p className="text-xl font-bold text-f1-red">${hostTotal.toFixed(0)}</p>
                          </div>
                        </div>

                        {/* Paid out status */}
                        {isPaidOut && pot?.winner_user_ids?.length > 0 && (
                          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4 text-center">
                            <p className="text-yellow-400 font-semibold text-sm">✅ Paid Out</p>
                            {pot.winner_user_ids.map(wid => {
                              const w = users.find(u => u.id === wid);
                              return w ? (
                                <p key={wid} className="text-yellow-300 text-sm">{w.emoji} {w.name} — ${parseFloat(pot.prize_per_winner).toFixed(2)}</p>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>

                      {/* Payment toggles */}
                      <div className="card">
                        <h3 className="font-semibold mb-3">Mark Payments ({paidCount}/{users.length} paid)</h3>
                        <div className="space-y-2">
                          {potLoading ? (
                            <p className="text-gray-400 text-sm">Loading...</p>
                          ) : users.map(user => {
                            const paid = paidIds.includes(user.id);
                            return (
                              <button
                                key={user.id}
                                onClick={() => handleTogglePaid(user.id)}
                                disabled={isPaidOut}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left disabled:opacity-50 ${
                                  paid ? 'bg-green-900/40 border border-green-700/50' : 'bg-f1-dark hover:bg-gray-700 border border-transparent'
                                }`}
                              >
                                <span className="text-xl">{user.emoji}</span>
                                <span className="flex-1 font-medium">{user.name}</span>
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${paid ? 'bg-green-700 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
                                  {paid ? '✓ $10 Paid' : 'Unpaid'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Pay out button */}
                      {isPastRace(potRace) && !isPaidOut && (
                        <div className="card">
                          <h3 className="font-semibold mb-2">Record Payout</h3>
                          <p className="text-xs text-gray-400 mb-3">
                            Automatically finds the highest scoring paid player(s) and records the payout. Calculate scores first.
                          </p>
                          <button
                            onClick={handlePayOut}
                            className="btn-primary w-full"
                          >
                            🏆 Record Winner & Pay Out
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            ) : (
              <div className="card text-center py-8 text-gray-400">
                <p className="text-3xl mb-2">💰</p>
                <p>Select a race to manage its pot</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Participants & Emails Tab */}
      {activeTab === 'participants' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Participant Selector */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Select Participant</h2>
              <select
                value={selectedParticipant}
                onChange={(e) => handleSelectParticipant(e.target.value)}
                className="select w-full mb-4"
              >
                <option value="">-- Choose a participant --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.emoji} {user.name}{user.is_host ? ' (Host)' : ''}
                  </option>
                ))}
              </select>

              {/* Participant Summary List */}
              <div className="space-y-2">
                {users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectParticipant(user.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                      selectedParticipant === user.id
                        ? 'bg-f1-red/20 border border-f1-red/40'
                        : 'bg-f1-dark hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-2xl">{user.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.name}</span>
                        {user.is_host && (
                          <span className="text-xs bg-f1-red px-1.5 py-0.5 rounded">Host</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 truncate block">
                        {user.email ? user.email : 'No email set'}
                      </span>
                    </div>
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      user.email ? 'bg-green-500' : 'bg-gray-600'
                    }`} title={user.email ? 'Email set' : 'No email'} />
                  </button>
                ))}
              </div>
            </div>

            {/* Participant Email Management */}
            <div className="space-y-4">
              {selectedParticipantData ? (
                <>
                  <div className="card">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{selectedParticipantData.emoji}</span>
                      <div>
                        <h2 className="text-lg font-semibold">{selectedParticipantData.name}</h2>
                        {selectedParticipantData.is_host && (
                          <span className="text-xs bg-f1-red px-2 py-0.5 rounded">Host</span>
                        )}
                      </div>
                    </div>

                    {participantMessage && (
                      <div className={`p-3 rounded mb-4 text-sm ${
                        participantMessage.type === 'success'
                          ? 'bg-green-900/50 text-green-200'
                          : 'bg-red-900/50 text-red-200'
                      }`}>
                        {participantMessage.text}
                      </div>
                    )}

                    {/* Email Section */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-400 mb-1">Email Address</p>
                      {editingEmail ? (
                        <form onSubmit={handleSaveParticipantEmail} className="flex gap-2">
                          <input
                            type="email"
                            value={participantEmail}
                            onChange={(e) => setParticipantEmail(e.target.value)}
                            placeholder="Enter email address"
                            className="input flex-1"
                            autoFocus
                          />
                          <button type="submit" className="btn-primary px-3">Save</button>
                          <button
                            type="button"
                            onClick={() => setEditingEmail(false)}
                            className="btn-secondary px-3"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className={selectedParticipantData.email ? 'text-white' : 'text-gray-500 italic'}>
                            {selectedParticipantData.email || 'No email set'}
                          </span>
                          <button
                            onClick={() => {
                              setParticipantEmail(selectedParticipantData.email || '');
                              setEditingEmail(true);
                            }}
                            className="text-xs text-f1-red hover:underline"
                          >
                            {selectedParticipantData.email ? 'Edit' : 'Add Email'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Toggle Host */}
                    <div className="flex items-center justify-between mb-4 p-3 bg-f1-dark rounded-lg">
                      <div>
                        <span className="text-sm font-medium">Admin / Host Access</span>
                        <p className="text-xs text-gray-500">Host can access this admin panel</p>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await updateUser(selectedParticipant, { is_host: !selectedParticipantData.is_host });
                            setParticipantMessage({ type: 'success', text: selectedParticipantData.is_host ? 'Host access removed' : 'Host access granted!' });
                          } catch {
                            setParticipantMessage({ type: 'error', text: 'Failed to update host status' });
                          }
                        }}
                        className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                          selectedParticipantData.is_host
                            ? 'bg-f1-red/20 text-f1-red hover:bg-f1-red/30'
                            : 'bg-green-800/30 text-green-400 hover:bg-green-800/50'
                        }`}
                      >
                        {selectedParticipantData.is_host ? 'Remove Host' : 'Make Host'}
                      </button>
                    </div>

                    {/* Notification Status */}
                    <div className="bg-f1-dark rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Qualifying Notifications</span>
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${
                          selectedParticipantData.notify_qualifying
                            ? 'bg-green-700 text-green-200'
                            : 'bg-gray-700 text-gray-400'
                        }`}>
                          {selectedParticipantData.notify_qualifying ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedParticipantData.email
                          ? 'Will receive reminder 1 hour before qualifying'
                          : 'Add an email to enable notifications'}
                      </p>
                    </div>

                    {/* Send Welcome Email */}
                    <button
                      onClick={handleSendTestEmail}
                      disabled={!selectedParticipantData.email || sendingTestEmail}
                      className="btn-secondary w-full disabled:opacity-50"
                    >
                      {sendingTestEmail ? 'Sending...' : '✉️ Send Welcome Email'}
                    </button>
                    {!selectedParticipantData.email && (
                      <p className="text-xs text-gray-500 text-center mt-1">Set an email address first</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="card text-center py-8 text-gray-400">
                  <p className="text-3xl mb-2">👥</p>
                  <p>Select a participant to manage their email</p>
                </div>
              )}

              {/* Trigger Notifications */}
              <div className="card">
                <h3 className="font-semibold mb-2">Manual Notification Trigger</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Manually check for upcoming qualifying sessions and send reminders to all users with email enabled.
                </p>
                <button
                  onClick={handleTriggerNotifications}
                  disabled={actionLoading}
                  className="btn-primary w-full"
                >
                  {actionLoading ? 'Running...' : '🔔 Trigger Notification Check'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'races' && <div className="grid md:grid-cols-2 gap-6">
        {/* Race Selection */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Select Race</h2>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {races.map((race) => (
              <button
                key={race.round}
                onClick={() => setSelectedRace(race)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedRace?.round === race.round
                    ? 'bg-f1-red text-white'
                    : 'bg-f1-dark hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">R{race.round}: {race.raceName}</span>
                    <p className="text-sm opacity-75">{race.date}</p>
                  </div>
                  {isPastRace(race) ? (
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded">Past</span>
                  ) : (
                    <span className="text-xs bg-green-700 px-2 py-1 rounded">Upcoming</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {selectedRace ? (
            <>
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">
                  {selectedRace.raceName}
                </h2>

                {/* Fetch Results Button */}
                <button
                  onClick={fetchResults}
                  disabled={actionLoading || !isPastRace(selectedRace)}
                  className="btn-primary w-full mb-4 disabled:opacity-50"
                >
                  {actionLoading ? 'Fetching from OpenF1...' : '⚡ Auto-Fetch Results & Score'}
                </button>
                <p className="text-xs text-gray-500 mb-4">
                  {isPastRace(selectedRace)
                    ? 'Pulls results from OpenF1 + Wikipedia and calculates all scores automatically.'
                    : 'Race hasn\'t happened yet.'}
                </p>

                {/* Result Status */}
                {raceResult && (
                  <div className="bg-f1-dark p-4 rounded-lg mb-4">
                    <h3 className="font-semibold mb-2">Current Results</h3>
                    <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                      <div>
                        <span className="text-gray-400">P1:</span>
                        <span className="ml-2">{raceResult.p1 || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">P2:</span>
                        <span className="ml-2">{raceResult.p2 || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">P3:</span>
                        <span className="ml-2">{raceResult.p3 || 'N/A'}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400">
                      Created: {new Date(raceResult.fetched_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Manual Data Entry */}
              {raceResult && (
                <div className="card">
                  <h3 className="font-semibold mb-4">Manual Data Entry</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Enter race data that needs to be filled in manually:
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Safety Car</span>
                      <button
                        onClick={() => setManualInputs(p => ({ ...p, safetyCar: !p.safetyCar }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          manualInputs.safetyCar ? 'bg-f1-red' : 'bg-gray-600'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          manualInputs.safetyCar ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Red Flag</span>
                      <button
                        onClick={() => setManualInputs(p => ({ ...p, redFlag: !p.redFlag }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          manualInputs.redFlag ? 'bg-f1-red' : 'bg-gray-600'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          manualInputs.redFlag ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Driver of the Day</label>
                      <select
                        value={manualInputs.driverOfTheDay}
                        onChange={(e) => setManualInputs(p => ({ ...p, driverOfTheDay: e.target.value }))}
                        className="select w-full"
                      >
                        <option value="">Select driver...</option>
                        {drivers.map(driver => (
                          <option key={driver.driverId} value={driver.driverId}>
                            {driver.name} ({driver.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={updateManualData}
                      disabled={actionLoading}
                      className="btn-secondary w-full"
                    >
                      Save Manual Data
                    </button>
                  </div>
                </div>
              )}

              {/* Recalculate Scores (manual override) */}
              {raceResult && (
                <div className="card">
                  <h3 className="font-semibold mb-2">Recalculate Scores</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Use this after manually editing safety car / red flag / DOTD data above.
                  </p>
                  <button
                    onClick={calculateScores}
                    disabled={actionLoading}
                    className="btn-secondary w-full"
                  >
                    {actionLoading ? 'Calculating...' : 'Recalculate Scores'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="card text-center py-8">
              <p className="text-gray-400">Select a race to manage results</p>
            </div>
          )}
        </div>
      </div>}
    </div>
  );
}

export default Admin;
