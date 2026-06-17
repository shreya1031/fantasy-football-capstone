import { useNavigate } from 'react-router-dom';
import { MotionPage } from '../../../design/primitives/Stat';
import { Panel } from '../../../design/primitives/Panel';
import { Button, Input, Label } from '../../../design/primitives/Button';
import { useTeamDraftStore } from '../../../lib/teamDraftStore';
import type { Formation } from '../../../lib/types';

const FORMATIONS: Formation[] = ['4-4-2', '4-3-3', '3-5-2'];

export function CreateTeamPage() {
  const navigate = useNavigate();
  const { name, formation, setName, setFormation } = useTeamDraftStore();

  const handleContinue = () => {
    if (!name.trim()) return;
    navigate('/team/select');
  };

  return (
    <MotionPage className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="font-body text-sm font-medium text-[var(--accent-green)]">Step 1 of 2</p>
        <h1 className="font-display text-3xl font-bold">Create Fantasy Team</h1>
        <p className="mt-1 font-body text-sm text-[var(--fg-2)]">Name your squad and choose a formation.</p>
      </header>

      <Panel title="Team Setup">
        <div className="space-y-6">
          <div>
            <Label htmlFor="teamName">Team name</Label>
            <Input
              id="teamName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. North London XI"
            />
          </div>

          <div>
            <Label>Formation</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {FORMATIONS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormation(f)}
                  className={`rounded-lg px-5 py-3 font-stat text-sm font-semibold transition-all ${
                    formation === f
                      ? 'bg-[var(--accent-green)] text-white shadow-[var(--glow-green)]'
                      : 'border border-[var(--panel-border)] bg-white text-[var(--fg-1)] hover:border-[var(--accent-green)]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleContinue} disabled={!name.trim()}>
              Continue to Player Selection
            </Button>
          </div>
        </div>
      </Panel>
    </MotionPage>
  );
}
