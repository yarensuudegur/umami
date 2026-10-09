import type { Exercise, Group, Level } from './types';

// 48 exercises chosen from yuhonas/free-exercise-db (The Unlicense, public domain).
// Ids match the dataset (and the bundled image names); descriptions are written for this app.
// Equipment: bodyweight and dumbbells, plus a sturdy bench or chair for a few moves.

const B: Level = 'beginner';
const I: Level = 'intermediate';

function e(id: string, name: string, group: Group, minLevel: Level, description: string, kind: Exercise['kind'] = 'reps'): Exercise {
  return { id, name, group, minLevel, kind, description };
}

export const EXERCISES: Exercise[] = [
  // Chest
  e('Pushups', 'Push-Up', 'chest', B, 'Hands under shoulders, body in one straight line: lower your chest to the floor and press back up.'),
  e('Incline_Push-Up', 'Incline Push-Up', 'chest', B, 'Hands on a sturdy bench or counter for an easier push-up that still works the chest.'),
  e('Push-Up_Wide', 'Wide Push-Up', 'chest', B, 'Place your hands wider than your shoulders to put more of the load on the chest.'),
  e('Push-Ups_With_Feet_Elevated', 'Feet-Elevated Push-Up', 'chest', I, 'Rest your feet on a bench to shift the work onto the upper chest and shoulders.'),
  e('Dumbbell_Bench_Press', 'Dumbbell Bench Press', 'chest', B, 'Lie on a bench and press two dumbbells from chest level up to straight arms.'),
  e('Dumbbell_Flyes', 'Dumbbell Fly', 'chest', B, 'With soft elbows, open your arms wide in an arc, then squeeze the dumbbells back together.'),
  e('Incline_Dumbbell_Press', 'Incline Dumbbell Press', 'chest', I, 'On an inclined bench, press the dumbbells up and slightly together to hit the upper chest.'),

  // Shoulders
  e('Seated_Dumbbell_Press', 'Seated Dumbbell Press', 'shoulders', B, 'Sit tall and press the dumbbells from shoulder height to overhead.'),
  e('Dumbbell_Shoulder_Press', 'Standing Dumbbell Press', 'shoulders', I, 'Stand with a tight core and press the dumbbells straight overhead.'),
  e('Side_Lateral_Raise', 'Lateral Raise', 'shoulders', B, 'Raise the dumbbells out to your sides to shoulder height, then lower slowly.'),
  e('Front_Dumbbell_Raise', 'Front Raise', 'shoulders', B, 'Lift a dumbbell in front of you to eye level with a straight arm, then lower with control.'),
  e('Arnold_Dumbbell_Press', 'Arnold Press', 'shoulders', I, 'Start with palms facing you and rotate them outward as you press overhead.'),

  // Triceps
  e('Bench_Dips', 'Bench Dip', 'triceps', B, 'Hands on a bench behind you: bend your elbows to lower your hips, then press back up.'),
  e('Standing_Dumbbell_Triceps_Extension', 'Overhead Triceps Extension', 'triceps', B, 'Hold one dumbbell overhead with both hands, lower it behind your head and extend.'),
  e('Tricep_Dumbbell_Kickback', 'Triceps Kickback', 'triceps', B, 'Hinge forward, keep your upper arm still and straighten your elbow to kick the weight back.'),
  e('Incline_Push-Up_Close-Grip', 'Close-Grip Incline Push-Up', 'triceps', B, 'Hands close together on a bench; elbows stay tucked to target the triceps.'),
  e('Lying_Dumbbell_Tricep_Extension', 'Lying Triceps Extension', 'triceps', I, 'Lying down, bend only at the elbows to lower the dumbbells toward your head, then extend.'),

  // Biceps
  e('Dumbbell_Bicep_Curl', 'Dumbbell Curl', 'biceps', B, 'Keep your elbows at your sides and curl the dumbbells up to your shoulders.'),
  e('Hammer_Curls', 'Hammer Curl', 'biceps', B, 'Curl with palms facing each other to work the biceps and forearms.'),
  e('Concentration_Curls', 'Concentration Curl', 'biceps', B, 'Seated, brace your elbow on your thigh and curl slowly with no swinging.'),
  e('Zottman_Curl', 'Zottman Curl', 'biceps', I, 'Curl up with palms up, rotate your wrists at the top and lower with palms down.'),

  // Back
  e('Bent_Over_Two-Dumbbell_Row', 'Bent-Over Dumbbell Row', 'back', B, 'Hinge at the hips with a flat back and row both dumbbells toward your waist.'),
  e('One-Arm_Dumbbell_Row', 'One-Arm Dumbbell Row', 'back', B, 'Support yourself on a bench and pull one dumbbell up to your hip, then switch sides.'),
  e('Bent_Over_Two-Dumbbell_Row_With_Palms_In', 'Neutral-Grip Row', 'back', B, 'Same bent-over row with palms facing each other for a stronger mid-back squeeze.'),
  e('Reverse_Flyes', 'Reverse Fly', 'back', B, 'Bent over, open your arms out to the sides to work the rear shoulders and upper back.'),
  e('Superman', 'Superman', 'back', B, 'Lie face down and lift arms and legs off the floor, squeezing your back and glutes.', 'time'),
  e('Dumbbell_Shrug', 'Dumbbell Shrug', 'back', B, 'Hold dumbbells at your sides and lift your shoulders straight up toward your ears.'),
  e('Dumbbell_Incline_Row', 'Incline Dumbbell Row', 'back', I, 'Lie chest-down on an incline bench and row the dumbbells up toward your ribs.'),

  // Legs
  e('Bodyweight_Squat', 'Bodyweight Squat', 'legs', B, 'Feet shoulder-width apart: sit your hips back and down, then stand tall again.'),
  e('Dumbbell_Squat', 'Dumbbell Squat', 'legs', B, 'Hold dumbbells at your sides and squat down until your thighs are parallel to the floor.'),
  e('Split_Squat_with_Dumbbells', 'Split Squat', 'legs', B, 'In a staggered stance, lower your back knee toward the floor and drive up through the front heel.'),
  e('Dumbbell_Lunges', 'Dumbbell Lunge', 'legs', B, 'Step forward, lower until both knees reach about 90 degrees, then push back to standing.'),
  e('Bodyweight_Walking_Lunge', 'Walking Lunge', 'legs', B, 'Take a long step into a lunge and keep stepping forward, alternating legs.'),
  e('Stiff-Legged_Dumbbell_Deadlift', 'Stiff-Leg Deadlift', 'legs', B, 'With soft knees, push your hips back and lower the dumbbells along your legs, then stand.'),
  e('Dumbbell_Step_Ups', 'Dumbbell Step-Up', 'legs', I, 'Step onto a sturdy bench with dumbbells in hand, drive up through the heel, then step down.'),
  e('Standing_Dumbbell_Calf_Raise', 'Calf Raise', 'legs', B, 'Rise onto your toes with dumbbells at your sides, pause, then lower slowly.'),
  e('Butt_Lift_Bridge', 'Glute Bridge', 'legs', B, 'Lie on your back with knees bent and lift your hips until your body forms a straight line.'),
  e('Single_Leg_Glute_Bridge', 'Single-Leg Glute Bridge', 'legs', I, 'Bridge up on one leg while the other stays extended, keeping your hips level.'),
  e('Freehand_Jump_Squat', 'Jump Squat', 'legs', I, 'Squat down, then explode upward into a jump and land softly.'),
  e('Dumbbell_Rear_Lunge', 'Reverse Lunge', 'legs', I, 'Step backward into a lunge with dumbbells in hand, then return to standing.'),

  // Core
  e('Plank', 'Plank', 'core', B, 'Hold a straight line from head to heels on your forearms and toes, bracing your abs.', 'time'),
  e('Side_Bridge', 'Side Plank', 'core', B, 'Lie on your side, lift your hips on your forearm and hold a straight line.', 'time'),
  e('Crunches', 'Crunch', 'core', B, 'Lying on your back with knees bent, curl your shoulders off the floor and lower slowly.'),
  e('Reverse_Crunch', 'Reverse Crunch', 'core', B, 'Bring your knees toward your chest by curling your hips off the floor.'),
  e('Russian_Twist', 'Russian Twist', 'core', I, 'Sit leaning back with feet lifted and rotate your torso from side to side.'),
  e('Dead_Bug', 'Dead Bug', 'core', B, 'On your back, lower the opposite arm and leg toward the floor while keeping your back flat.'),
  e('Air_Bike', 'Bicycle Crunch', 'core', B, 'Pedal your legs while touching each elbow to the opposite knee.'),
  e('Mountain_Climbers', 'Mountain Climber', 'core', B, 'From a push-up position, drive your knees toward your chest in a fast running motion.', 'time'),
];

const BY_ID = new Map(EXERCISES.map((x) => [x.id, x]));

export function getExercise(id: string): Exercise | undefined {
  return BY_ID.get(id);
}

const ORDER: Record<Level, number> = { beginner: 0, intermediate: 1, advanced: 2 };

/** Exercises of a muscle group the given level may do (advanced users can do everything). */
export function exercisesFor(group: Group, level: Level): Exercise[] {
  return EXERCISES.filter((x) => x.group === group && ORDER[x.minLevel] <= ORDER[level]);
}
