import express from 'express';
import supabase from '../db/supabase.js';

const router = express.Router();

// GET /api/users - Get all users
router.get('/', async (req, res) => {
  try {
    if (!supabase) {
      // Return mock data when Supabase is not configured
      return res.json([
        { id: '1', name: 'Dad', emoji: '👨', is_host: false, created_at: new Date().toISOString() },
        { id: '2', name: 'Mom', emoji: '👩', is_host: false, created_at: new Date().toISOString() },
        { id: '3', name: 'Wyatt', emoji: '🏎️', is_host: true, created_at: new Date().toISOString() }
      ]);
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - Get a single user
router.get('/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.json({ id: req.params.id, name: 'User', emoji: '👤' });
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'User not found' });

    res.json(data);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/users - Create a new user
router.post('/', async (req, res) => {
  try {
    const { name, emoji, is_host } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!supabase) {
      return res.json({
        id: Date.now().toString(),
        name,
        emoji: emoji || '👤',
        is_host: is_host || false,
        created_at: new Date().toISOString()
      });
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{ name, emoji: emoji || '👤', is_host: is_host || false }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id - Update a user
router.put('/:id', async (req, res) => {
  try {
    const { name, emoji } = req.body;

    if (!supabase) {
      return res.json({ id: req.params.id, name, emoji });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ name, emoji })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id - Delete a user
router.delete('/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.json({ message: 'User deleted' });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
