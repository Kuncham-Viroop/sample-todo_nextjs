/**
 * TodoComponent displays a Todo card with its associated Task's title and description.
 * It uses SENS Psychology design elements and supports optimistic UI updates.
 */
import { TrashIcon } from '@heroicons/react/24/outline';
import { useUpdateTodo, useDeleteTodo } from '../lib/hooks/todo';
import Avatar from './Avatar';
import TimeInfo from './TimeInfo';
import { ChangeEvent } from 'react';
import type { Todo, User, Task } from '@prisma/client';

type Props = {
    value: Todo & { owner: User; task: Task };
    optimistic?: boolean;
};

export default function TodoComponent({ value, optimistic }: Props) {
    const { trigger: updateTodo } = useUpdateTodo({ optimisticUpdate: true });
    const { trigger: deleteTodo } = useDeleteTodo({ optimisticUpdate: true });

    // Delete Todo handler
    const onDeleteTodo = () => {
        void deleteTodo({ where: { id: value.id } });
    };

    // Toggle completed state
    const toggleCompleted = (completed: boolean) => {
        if (completed === !!value.completedAt) {
            return;
        }
        void updateTodo({
            where: { id: value.id },
            data: { completedAt: completed ? new Date() : null },
        });
    };

    // SENS Psychology style colors
    const sensColors = {
        primary: 'bg-[#6C63FF]',
        accent: 'bg-[#FF6584]',
        text: 'text-[#22223B]',
        card: 'bg-[#F7F6F9]',
    };

    return (
        <div className={`border rounded-lg px-8 py-4 shadow-lg flex flex-col items-center w-full lg:w-[480px] ${sensColors.card}`}>
            <div className="flex justify-between w-full mb-4">
                <div>
                    <h3
                        className={`text-xl line-clamp-1 ${value.completedAt ? 'line-through text-gray-400 italic' : sensColors.text}`}
                    >
                        {value.task?.title || 'Untitled Task'}
                        {optimistic && <span className="loading loading-spinner loading-sm ml-1"></span>}
                    </h3>
                    {value.task?.description && (
                        <p className="text-sm text-gray-500 mt-1">{value.task.description}</p>
                    )}
                </div>
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        className="checkbox mr-2"
                        checked={!!value.completedAt}
                        disabled={optimistic}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => toggleCompleted(e.currentTarget.checked)}
                    />
                    <TrashIcon
                        className={`w-6 h-6 ${optimistic ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 cursor-pointer'}`}
                        onClick={() => {
                            !optimistic && onDeleteTodo();
                        }}
                    />
                </div>
            </div>
            <div className="flex justify-end w-full space-x-2">
                <TimeInfo value={value} />
                <Avatar user={value.owner} size={18} />
            </div>
        </div>
    );
}
