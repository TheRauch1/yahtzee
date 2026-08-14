import { useState, type FormEvent } from 'react';
import { useTranslation } from '@/hooks/use-locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddPlayerFormProps {
	onAdd: (name: string) => void;
}

export function AddPlayerForm({ onAdd }: AddPlayerFormProps) {
	const t = useTranslation();
	const [name, setName] = useState('');
	const trimmed = name.trim();

	function submit(event: FormEvent) {
		event.preventDefault();
		if (!trimmed) return;
		onAdd(trimmed);
		setName('');
	}

	return (
		<form onSubmit={submit} className="flex gap-2">
			<Input
				type="text"
				value={name}
				onChange={(event) => setName(event.target.value)}
				placeholder={t.addPlayerForm.playerNamePlaceholder}
				aria-label={t.addPlayerForm.playerNamePlaceholder}
			/>
			<Button type="submit" disabled={!trimmed}>
				{t.addPlayerForm.addPlayer}
			</Button>
		</form>
	);
}
