import { PlusIcon } from '@heroicons/react/24/outline';
import { useCreateTodo, useFindManyTodo } from 'lib/hooks/todo';
import { useFindManyTask, useCreateTask } from 'lib/hooks/task';
import BreadCrumb from 'components/BreadCrumb';
import TodoComponent from 'components/Todo';
import WithNavBar from 'components/WithNavBar';
import { GetServerSideProps } from 'next';
import { ChangeEvent, useState } from 'react';
import { getEnhancedPrisma } from 'server/enhanced-db';
import type { List, Space, Task } from '@prisma/client';


type Props = {
    space: Space;
    list: List;
};

export default function TodoList(props: Props) {

    // State for Task selector and new Task creation
    const [taskQuery, setTaskQuery] = useState('');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const { trigger: createTodo } = useCreateTodo({ optimisticUpdate: true });
    const { trigger: createTask } = useCreateTask({ optimisticUpdate: true });

    // Fetch tasks for this space
    const { data: tasks } = useFindManyTask({ where: { spaceId: props.space.id }, orderBy: { createdAt: 'desc' } });

    // Fetch todos for this list
    const { data: todos } = useFindManyTodo(
        {
            where: { listId: props.list.id },
            include: {
                owner: true,
                task: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        },
        { keepPreviousData: true }
    );

    // Create a new Task and then a Todo referencing it
    const _createTaskAndTodo = async () => {
        if (!taskQuery) return;
        const newTask = await createTask({
            data: {
                title: taskQuery,
                description: newTaskDesc,
                space: { connect: { id: props.space.id } },
                owner: { connect: { id: props.space.ownerId } },
            },
        });
        if (newTask?.id) {
            setSelectedTask(newTask);
            await _createTodo(newTask);
        }
        setTaskQuery('');
        setNewTaskDesc('');
    };

    // Create a Todo referencing the selected Task
    const _createTodo = async (task: Task | null) => {
        if (!task) return;
        await createTodo({
            data: {
                task: { connect: { id: task.id } },
                list: { connect: { id: props.list.id } },
            },
        });
        setSelectedTask(null);
    };

    if (!props.space || !props.list) {
        return <></>;
    }

    // SENS Psychology style colors
    const sensColors = {
        primary: 'bg-[#6C63FF]',
        accent: 'bg-[#FF6584]',
        text: 'text-[#22223B]',
        card: 'bg-[#F7F6F9]',
    };

    return (
        <WithNavBar>
            <div className="px-8 py-2">
                <BreadCrumb space={props.space} list={props.list} />
            </div>
            <div className={`container w-full flex flex-col items-center py-12 mx-auto ${sensColors.card}`}>
                <h1 className={`text-2xl font-semibold mb-4 ${sensColors.text}`}>{props.list?.title}</h1>
                {/* Task selector with typeahead and add-new */}
                <div className="flex flex-col space-y-2 w-80">
                    <input
                        type="text"
                        placeholder="Type or select a Task (e.g. Read a Book)"
                        className={`input input-bordered w-full mt-2 ${sensColors.text}`}
                        value={taskQuery}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setTaskQuery(e.currentTarget.value);
                            setSelectedTask(null);
                        }}
                    />
                    {/* Show matching tasks */}
                    {taskQuery && (
                        <div className="bg-white border rounded shadow p-2 max-h-40 overflow-y-auto">
                            {tasks?.filter(t => t.title.toLowerCase().includes(taskQuery.toLowerCase())).map(task => (
                                <div
                                    key={task.id}
                                    className={`cursor-pointer py-1 px-2 hover:${sensColors.primary} rounded ${sensColors.text}`}
                                    onClick={() => setSelectedTask(task)}
                                >
                                    <span className="font-semibold">{task.title}</span>
                                    {task.description && <span className="ml-2 text-xs text-gray-500">{task.description}</span>}
                                </div>
                            ))}
                            {/* Option to add new Task if not found */}
                            {!tasks?.some(t => t.title.toLowerCase() === taskQuery.toLowerCase()) && (
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        placeholder="Task description (optional)"
                                        className="input input-bordered w-full mb-2"
                                        value={newTaskDesc}
                                        onChange={e => setNewTaskDesc(e.currentTarget.value)}
                                    />
                                    <button
                                        className={`btn ${sensColors.primary} text-white w-full`}
                                        onClick={_createTaskAndTodo}
                                    >
                                        <PlusIcon className="w-4 h-4 mr-1" /> Add new Task & Todo
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    {/* If a Task is selected, show and allow creating Todo */}
                    {selectedTask && (
                        <div className="flex items-center space-x-2 mt-2">
                            <span className="font-semibold">Selected Task:</span>
                            <span>{selectedTask.title}</span>
                            {selectedTask.description && <span className="ml-2 text-xs text-gray-500">{selectedTask.description}</span>}
                            <button
                                className={`btn ${sensColors.accent} text-white ml-2`}
                                onClick={() => _createTodo(selectedTask)}
                            >
                                <PlusIcon className="w-4 h-4 mr-1" /> Add Todo
                            </button>
                        </div>
                    )}
                </div>

                {/* Todo list */}
                <ul className="flex flex-col space-y-4 py-8 w-11/12 md:w-auto">
                    {todos?.map((todo) => (
                        <TodoComponent key={todo.id} value={todo} optimistic={todo.$optimistic} />
                    ))}
                </ul>
            </div>
        </WithNavBar>
    );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, res, params }) => {
    const db = await getEnhancedPrisma({ req, res });
    const space = await db.space.findUnique({
        where: { slug: params!.slug as string },
    });
    if (!space) {
        return {
            notFound: true,
        };
    }

    const list = await db.list.findUnique({
        where: { id: params!.listId as string },
    });
    if (!list) {
        return {
            notFound: true,
        };
    }

    return {
        props: { space, list },
    };
};
