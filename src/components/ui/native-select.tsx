import * as React from 'react';
import { ChevronDownIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type NativeSelectProps = Omit<React.ComponentProps<'select'>, 'size'> & {
	size?: 'sm' | 'default';
};

function NativeSelect({ className, size = 'default', ...props }: NativeSelectProps) {
	return (
		<div
			data-slot="native-select-wrapper"
			data-size={size}
			className={cn(
				'group/native-select relative w-fit has-[select:disabled]:opacity-50',
				className
			)}
		>
			<select
				data-slot="native-select"
				data-size={size}
				className={cn(
					'h-9 w-full min-w-0 appearance-none rounded-md border border-input bg-transparent py-1 pr-8 pl-3 text-sm shadow-xs transition-[color,box-shadow] outline-none select-none disabled:pointer-events-none disabled:cursor-not-allowed',
					'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
					'dark:bg-input/30 dark:hover:bg-input/50',
					'group-data-[size=sm]/native-select:h-8 group-data-[size=sm]/native-select:text-xs'
				)}
				{...props}
			/>
			<ChevronDownIcon
				aria-hidden="true"
				data-slot="native-select-icon"
				className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
			/>
		</div>
	);
}

function NativeSelectOption({ className, ...props }: React.ComponentProps<'option'>) {
	return (
		<option
			data-slot="native-select-option"
			className={cn('bg-[Canvas] text-[CanvasText]', className)}
			{...props}
		/>
	);
}

export { NativeSelect, NativeSelectOption };
