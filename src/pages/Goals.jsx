import { useEffect, useMemo, useState } from 'react'
import { Plus, Target, CheckCircle2 } from 'lucide-react'
import AppHeader from '../components/AppHeader'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import GoalFormModal from '../components/GoalFormModal'
import GoalCard from '../components/GoalCard'
import { useGoals } from '../hooks/useGoals'
import { useSavings } from '../hooks/useSavings'
import { getSetting } from '../storage/settingsStorage'
import { splitGoals } from '../utils/savingsCalculations'
import './Goals.css'

export default function Goals() {
  const { goals, loading, addGoal, editGoal, removeGoal } = useGoals()
  const { savings, refresh: refreshSavings } = useSavings()
  const [currency, setCurrency] = useState('KSh')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getSetting('currency').then((c) => setCurrency(c || 'KSh'))
  }, [])

  const { active, completed } = useMemo(
    () => splitGoals(goals, savings),
    [goals, savings]
  )

  function openNew() { setEditing(null); setFormOpen(true) }
  function openEdit(goal) { setEditing(goal); setFormOpen(true) }

  async function handleCreateOrEdit(data) {
    if (editing) await editGoal(editing.id, data)
    else await addGoal(data)
    await refreshSavings()
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await removeGoal(pendingDelete.id)
      await refreshSavings()
      setPendingDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <AppHeader
        title="Goals"
        subtitle={`${active.length} active · ${completed.length} completed`}
        right={
          <button className="btn btn--primary" onClick={openNew}>
            <Plus size={16} /> New goal
          </button>
        }
      />

      {loading ? (
        <p className="goals__loading">Loading…</p>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          message="Create your first savings goal and start tracking progress."
          action={
            <button className="btn btn--primary" onClick={openNew}>
              <Plus size={16} /> Add a goal
            </button>
          }
        />
      ) : (
        <>
          <section className="goals__section">
            <p className="goals__eyebrow">ACTIVE</p>
            {active.length === 0 ? (
              <p className="goals__empty-line">
                Nothing active. Add a new goal to keep going.
              </p>
            ) : (
              <div className="goals__grid">
                {active.map(({ goal, stats }) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    stats={stats}
                    currency={currency}
                    onEdit={openEdit}
                    onDelete={setPendingDelete}
                  />
                ))}
              </div>
            )}
          </section>

          {completed.length > 0 && (
            <section className="goals__section">
              <p className="goals__eyebrow">
                <CheckCircle2 size={14} /> COMPLETED
              </p>
              <div className="goals__grid">
                {completed.map(({ goal, stats }) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    stats={stats}
                    currency={currency}
                    onEdit={openEdit}
                    onDelete={setPendingDelete}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <GoalFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreateOrEdit}
        initial={editing}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete this goal?"
        message={
          pendingDelete
            ? `"${pendingDelete.name}" and all its savings records will be permanently removed. This cannot be undone.`
            : ''
        }
        confirmLabel={deleting ? 'Deleting…' : 'Delete goal'}
        destructive
      />
    </>
  )
}
