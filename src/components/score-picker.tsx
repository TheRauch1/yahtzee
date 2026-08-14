import { useState } from 'react';

import { DiceFace } from '@/components/dice-face';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useTranslation } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';
import {
	LARGE_STRAIGHT_POINTS,
	SMALL_STRAIGHT_POINTS,
	YAHTZEE_POINTS,
	chanceScore,
	fourOfAKindScore,
	fullHouseScore,
	pairScore,
	threeOfAKindScore,
	twoPairsScore,
	upperCategoryScore,
	upperCategoryValue
} from '@/lib/scoring';
import type { ScoringCategory } from '@/lib/types';
import { UPPER_CATEGORIES } from '@/lib/types';

const DIE_VALUES = [1, 2, 3, 4, 5, 6];
const MAX_CHANCE_DICE = 5;

interface ScorePickerProps {
	category: ScoringCategory;
	current: number | null;
	onScore: (score: number) => void;
	onErase: () => void;
	onClose: () => void;
}

function OptionRow({
	onClick,
	score,
	emphasize = false,
	children
}: {
	onClick: () => void;
	score: number;
	emphasize?: boolean;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				'flex w-full items-center justify-between rounded-lg p-3 transition-colors hover:bg-accent',
				emphasize ? 'border-2' : 'border'
			)}
		>
			<div className="flex items-center gap-2">{children}</div>
			<span className="text-lg font-semibold tabular-nums">{score}</span>
		</button>
	);
}

export function ScorePicker({ category, current, onScore, onErase, onClose }: ScorePickerProps) {
	const t = useTranslation();
	const isUpper = UPPER_CATEGORIES.includes(category);

	const [firstPair, setFirstPair] = useState<number | null>(null);
	const [secondPair, setSecondPair] = useState<number | null>(null);
	const [threeOfAKind, setThreeOfAKind] = useState<number | null>(null);
	const [fullHousePair, setFullHousePair] = useState<number | null>(null);
	const [selectedDice, setSelectedDice] = useState<number[]>([]);

	function submit(score: number) {
		onScore(Number.isNaN(score) ? 0 : score);
	}

	function pickFirstPair(value: number) {
		setFirstPair(value);
		if (secondPair !== null) submit(twoPairsScore(value, secondPair));
	}

	function pickSecondPair(value: number) {
		setSecondPair(value);
		if (firstPair !== null) submit(twoPairsScore(firstPair, value));
	}

	function pickThreeOfAKind(value: number) {
		setThreeOfAKind(value);
		if (fullHousePair !== null) submit(fullHouseScore(value, fullHousePair));
	}

	function pickFullHousePair(value: number) {
		setFullHousePair(value);
		if (threeOfAKind !== null) submit(fullHouseScore(threeOfAKind, value));
	}

	function addDie(value: number) {
		if (selectedDice.length >= MAX_CHANCE_DICE) return;
		const next = [...selectedDice, value];
		setSelectedDice(next);
		if (next.length === MAX_CHANCE_DICE) submit(chanceScore(next));
	}

	function removeDie(index: number) {
		setSelectedDice(selectedDice.filter((_, i) => i !== index));
	}

	let description: string;
	let body: React.ReactNode;

	if (isUpper) {
		description = t.scoreModal.howManyDidYouRoll(t.categories[category]);
		body = (
			<div className="space-y-3">
				{[0, 1, 2, 3, 4, 5].map((count) => (
					<OptionRow
						key={count}
						emphasize={count === 0}
						onClick={() => submit(upperCategoryScore(category, count))}
						score={upperCategoryScore(category, count)}
					>
						{count === 0 ? (
							<span className="text-sm text-muted-foreground">{t.scoreModal.none}</span>
						) : (
							Array.from({ length: count }, (_, i) => (
								<DiceFace key={i} value={upperCategoryValue(category)} size={24} />
							))
						)}
					</OptionRow>
				))}
			</div>
		);
	} else if (category === 'pair') {
		description = t.scoreModal.selectYourPair;
		body = (
			<div className="space-y-3">
				{[0, ...DIE_VALUES].map((value) => (
					<OptionRow
						key={value}
						emphasize={value === 0}
						onClick={() => submit(pairScore(value))}
						score={pairScore(value)}
					>
						{value === 0 ? (
							<span className="text-sm text-muted-foreground">{t.scoreModal.none}</span>
						) : (
							<>
								<DiceFace value={value} size={24} />
								<DiceFace value={value} size={24} />
							</>
						)}
					</OptionRow>
				))}
			</div>
		);
	} else if (category === 'two-pairs') {
		description = t.scoreModal.selectYourTwoPairs;
		body = (
			<div className="space-y-4">
				<OptionRow emphasize onClick={() => submit(0)} score={0}>
					<span className="text-muted-foreground">{t.scoreModal.none}</span>
				</OptionRow>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<h3 className="text-center text-sm font-medium text-muted-foreground">
							{t.scoreModal.firstPair}
						</h3>
						<ToggleGroup
							variant="outline"
							className="w-full flex-col"
							value={firstPair !== null ? [String(firstPair)] : []}
							onValueChange={(values) => pickFirstPair(Number(values[0]))}
						>
							{DIE_VALUES.map((value) => (
								<ToggleGroupItem
									key={value}
									value={String(value)}
									className="w-full justify-between px-2 py-6"
								>
									<span className="flex items-center gap-1">
										<DiceFace value={value} size={20} />
										<DiceFace value={value} size={20} />
									</span>
									<span className="text-sm font-medium tabular-nums">{pairScore(value)}</span>
								</ToggleGroupItem>
							))}
						</ToggleGroup>
					</div>

					<div className="space-y-2">
						<h3 className="text-center text-sm font-medium text-muted-foreground">
							{t.scoreModal.secondPair}
						</h3>
						<ToggleGroup
							variant="outline"
							className="w-full flex-col"
							value={secondPair !== null ? [String(secondPair)] : []}
							onValueChange={(values) => pickSecondPair(Number(values[0]))}
						>
							{DIE_VALUES.map((value) => (
								<ToggleGroupItem
									key={value}
									value={String(value)}
									className="w-full justify-between px-2 py-6"
								>
									<span className="flex items-center gap-1">
										<DiceFace value={value} size={20} />
										<DiceFace value={value} size={20} />
									</span>
									<span className="text-sm font-medium tabular-nums">{pairScore(value)}</span>
								</ToggleGroupItem>
							))}
						</ToggleGroup>
					</div>
				</div>

				<p className="text-center text-sm text-muted-foreground">
					{t.scoreModal.selectOnePairPerColumn}
				</p>
			</div>
		);
	} else if (category === 'three-of-a-kind') {
		description = t.scoreModal.selectThreeOfAKindHint;
		body = (
			<div className="space-y-3">
				<OptionRow emphasize onClick={() => submit(0)} score={0}>
					<span className="text-muted-foreground">{t.scoreModal.none}</span>
				</OptionRow>
				{DIE_VALUES.map((value) => (
					<OptionRow
						key={value}
						onClick={() => submit(threeOfAKindScore(value))}
						score={threeOfAKindScore(value)}
					>
						<DiceFace value={value} size={24} />
						<DiceFace value={value} size={24} />
						<DiceFace value={value} size={24} />
					</OptionRow>
				))}
			</div>
		);
	} else if (category === 'four-of-a-kind') {
		description = t.scoreModal.selectFourOfAKindHint;
		body = (
			<div className="space-y-3">
				<OptionRow emphasize onClick={() => submit(0)} score={0}>
					<span className="text-muted-foreground">{t.scoreModal.none}</span>
				</OptionRow>
				{DIE_VALUES.map((value) => (
					<OptionRow
						key={value}
						onClick={() => submit(fourOfAKindScore(value))}
						score={fourOfAKindScore(value)}
					>
						<DiceFace value={value} size={24} />
						<DiceFace value={value} size={24} />
						<DiceFace value={value} size={24} />
						<DiceFace value={value} size={24} />
					</OptionRow>
				))}
			</div>
		);
	} else if (category === 'full-house') {
		description = t.scoreModal.selectFullHouseHint;
		body = (
			<div className="space-y-4">
				<OptionRow emphasize onClick={() => submit(0)} score={0}>
					<span className="text-muted-foreground">{t.scoreModal.none}</span>
				</OptionRow>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<h3 className="text-center text-sm font-medium text-muted-foreground">
							{t.categories['three-of-a-kind']}
						</h3>
						<ToggleGroup
							variant="outline"
							className="w-full flex-col"
							value={threeOfAKind !== null ? [String(threeOfAKind)] : []}
							onValueChange={(values) => pickThreeOfAKind(Number(values[0]))}
						>
							{DIE_VALUES.map((value) => (
								<ToggleGroupItem
									key={value}
									value={String(value)}
									className="w-full justify-between px-2 py-6"
								>
									<span className="flex items-center gap-1">
										<DiceFace value={value} size={20} />
										<DiceFace value={value} size={20} />
										<DiceFace value={value} size={20} />
									</span>
									<span className="text-sm font-medium tabular-nums">{value}×3</span>
								</ToggleGroupItem>
							))}
						</ToggleGroup>
					</div>

					<div className="space-y-2">
						<h3 className="text-center text-sm font-medium text-muted-foreground">
							{t.categories.pair}
						</h3>
						<ToggleGroup
							variant="outline"
							className="w-full flex-col"
							value={fullHousePair !== null ? [String(fullHousePair)] : []}
							onValueChange={(values) => pickFullHousePair(Number(values[0]))}
						>
							{DIE_VALUES.map((value) => (
								<ToggleGroupItem
									key={value}
									value={String(value)}
									className="w-full justify-between px-2 py-6"
								>
									<span className="flex items-center gap-1">
										<DiceFace value={value} size={20} />
										<DiceFace value={value} size={20} />
									</span>
									<span className="text-sm font-medium tabular-nums">{value}×2</span>
								</ToggleGroupItem>
							))}
						</ToggleGroup>
					</div>
				</div>

				<p className="text-center text-sm text-muted-foreground">
					{t.scoreModal.selectThreeAndPair}
				</p>
			</div>
		);
	} else if (category === 'small-straight' || category === 'large-straight') {
		const isSmall = category === 'small-straight';
		const points = isSmall ? SMALL_STRAIGHT_POINTS : LARGE_STRAIGHT_POINTS;
		const faces = isSmall ? [1, 2, 3, 4, 5] : [2, 3, 4, 5, 6];
		description = isSmall ? t.scoreModal.selectSmallStraight : t.scoreModal.selectLargeStraight;
		body = (
			<div className="space-y-3">
				<OptionRow emphasize onClick={() => submit(0)} score={0}>
					<span className="text-muted-foreground">{t.scoreModal.none}</span>
				</OptionRow>
				<OptionRow onClick={() => submit(points)} score={points}>
					{faces.map((value) => (
						<DiceFace key={value} value={value} size={24} />
					))}
				</OptionRow>
			</div>
		);
	} else if (category === 'yahtzee') {
		description = t.scoreModal.selectYahtzee;
		body = (
			<div className="space-y-3">
				<OptionRow emphasize onClick={() => submit(0)} score={0}>
					<span className="text-muted-foreground">{t.scoreModal.none}</span>
				</OptionRow>
				<OptionRow onClick={() => submit(YAHTZEE_POINTS)} score={YAHTZEE_POINTS}>
					<span className="font-medium">{t.categories.yahtzee}</span>
				</OptionRow>
			</div>
		);
	} else {
		description = t.scoreModal.selectChanceDice;
		body = (
			<div className="space-y-4">
				<OptionRow
					emphasize
					onClick={() => {
						setSelectedDice([]);
						submit(0);
					}}
					score={0}
				>
					<span className="text-muted-foreground">{t.scoreModal.none}</span>
				</OptionRow>

				<div className="space-y-3">
					<h3 className="text-center text-sm font-medium text-muted-foreground">
						{t.scoreModal.clickDiceToAdd(MAX_CHANCE_DICE)}
					</h3>
					<div className="grid grid-cols-3 gap-2">
						{DIE_VALUES.map((value) => (
							<button
								key={value}
								type="button"
								disabled={selectedDice.length >= MAX_CHANCE_DICE}
								aria-label={t.scoreModal.addDie(value)}
								onClick={() => addDie(value)}
								className="flex flex-col items-center justify-center rounded-lg border p-3 transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
							>
								<DiceFace value={value} size={32} />
								<span className="mt-1 text-xs font-medium">{value}</span>
							</button>
						))}
					</div>
				</div>

				{selectedDice.length > 0 && (
					<div className="space-y-3 border-t pt-4">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium text-muted-foreground">
								{t.scoreModal.selectedDice}
							</span>
							<Button variant="destructive" size="sm" onClick={() => setSelectedDice([])}>
								{t.scoreModal.clearAll}
							</Button>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							{selectedDice.map((die, index) => (
								<div key={index} className="relative">
									<DiceFace value={die} size={28} />
									<button
										type="button"
										aria-label={t.scoreModal.removeDie(die)}
										onClick={() => removeDie(index)}
										className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-xs text-white"
									>
										×
									</button>
								</div>
							))}
						</div>

						<div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 p-3">
							<span className="font-medium">{t.scoreModal.totalScore}</span>
							<span className="text-xl font-bold tabular-nums">{chanceScore(selectedDice)}</span>
						</div>

						<p className="text-center text-sm text-muted-foreground">
							{t.scoreModal.moreDiceToSelect(MAX_CHANCE_DICE - selectedDice.length)}
						</p>
					</div>
				)}
			</div>
		);
	}

	return (
		<>
			<DialogHeader>
				<DialogTitle>{t.scoreModal.scoreFor(t.categories[category])}</DialogTitle>
				<DialogDescription>{description}</DialogDescription>
			</DialogHeader>

			{body}

			<DialogFooter className="sm:justify-start">
				{current !== null && (
					<Button variant="destructive" className="flex-1" onClick={onErase}>
						{t.scoreModal.eraseScore}
					</Button>
				)}
				<Button variant="outline" className="flex-1" onClick={onClose}>
					{t.common.cancel}
				</Button>
			</DialogFooter>
		</>
	);
}
