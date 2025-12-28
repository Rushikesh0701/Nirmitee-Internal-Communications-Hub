// Collection of 70 short inspirational thoughts for the day
export const thoughtsOfTheDay = [
  "Every day is a fresh start.",
  "Progress, not perfection.",
  "Small steps lead to big changes.",
  "Believe in your potential.",
  "Today is full of possibilities.",
  "Your attitude determines your direction.",
  "Success is a journey, not a destination.",
  "Dream big, work hard, stay focused.",
  "Challenges make you stronger.",
  "Be the change you wish to see.",
  "Every moment is a new beginning.",
  "Focus on progress, not perfection.",
  "You are capable of amazing things.",
  "Turn obstacles into opportunities.",
  "Your effort today shapes tomorrow.",
  "Stay positive, work hard, make it happen.",
  "Great things take time.",
  "Believe you can and you're halfway there.",
  "Success starts with a single step.",
  "Make today count.",
  "Your potential is limitless.",
  "Hard work beats talent when talent doesn't work hard.",
  "The only way to do great work is to love what you do.",
  "Innovation distinguishes leaders from followers.",
  "Stay curious, keep learning.",
  "Excellence is not a skill, it's an attitude.",
  "The future belongs to those who believe in their dreams.",
  "Be yourself; everyone else is already taken.",
  "Life is what happens when you're busy making plans.",
  "The only impossible journey is the one you never begin.",
  "In the middle of difficulty lies opportunity.",
  "It does not matter how slowly you go as long as you do not stop.",
  "Quality is not an act, it is a habit.",
  "The way to get started is to quit talking and begin doing.",
  "Don't let yesterday take up too much of today.",
  "You learn more from failure than from success.",
  "If you are working on something exciting, you don't have to be pushed.",
  "People who are crazy enough to think they can change the world, do.",
  "We may encounter many defeats but we must not be defeated.",
  "The only person you are destined to become is the person you decide to be.",
  "Go confidently in the direction of your dreams.",
  "The two most important days in your life are the day you are born and the day you find out why.",
  "Whether you think you can or you think you can't, you're right.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "An unexamined life is not worth living.",
  "Eighty percent of success is showing up.",
  "Your time is limited, don't waste it living someone else's life.",
  "Winning isn't everything, but wanting to win is.",
  "I am not a product of my circumstances. I am a product of my decisions.",
  "Every child is an artist. The problem is how to remain an artist once we grow up.",
  "You can never cross the ocean until you have the courage to lose sight of the shore.",
  "I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.",
  "Either you run the day, or the day runs you.",
  "Life is what we make it, always has been, always will be.",
  "The only way to do great work is to love what you do.",
  "If you can dream it, you can do it.",
  "It's kind of fun to do the impossible.",
  "There's a way to do it better - find it.",
  "Don't be afraid to give up the good to go for the great.",
  "Innovation is the ability to see change as an opportunity.",
  "The secret of getting ahead is getting started.",
  "You miss 100% of the shots you don't take.",
  "The only limit to our realization of tomorrow will be our doubts of today.",
  "The future depends on what you do today.",
  "It is during our darkest moments that we must focus to see the light.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The way to get started is to quit talking and begin doing.",
  "Don't let the fear of losing be greater than the excitement of winning.",
  "If you want to lift yourself up, lift up someone else.",
  "The only person you should try to be better than is the person you were yesterday.",
  "You don't have to be great to start, but you have to start to be great."
]

/**
 * Get a random thought of the day based on the current date
 * This ensures the same thought is shown throughout the day
 * @returns {string} A random thought
 */
export const getThoughtOfTheDay = () => {
  const today = new Date()
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24)
  const index = dayOfYear % thoughtsOfTheDay.length
  return thoughtsOfTheDay[index]
}




