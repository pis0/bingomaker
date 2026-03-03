package com.assukar.praia.menton.components 
{
	import flash.geom.Point;
	/**
	 * @author User
	 */
	public class MotionConstants 
	{
		// Ball Path //
		static public const BALL_X_SPEED: int = 34; //34
		static public const BALL_Y_SPEED: int = 42; //42
		static public const BALL_X_SPEEDS_XTRA: Vector.<int> = new <int>[55, 52, 49, 45, 40, 32, 28, 23, 18, 15]; 
		static public const BALL_Y_SPEED_NEXT: int = 90; //90
		static public const BALL_X_SPEED_NEXT: int = 90; //90
		static public const BALL_EXTRA_ANGULAR_SPEED: Number = 0.25; //0.25
		static public const BALL_DEFAULT_ANGULAR_SPEED: Number = 0.35; //0.35
		static public const BALL_STARTING_ANGLE: Number = 3.14159 + 0.7; //3.14159 + 0.7
		static public const BALL_X_DISTANCE: int = 68;//47
		static public const BALL_Y_DISTANCE: int = 210;//53
		static public const BALL_X_THRESHOLD: int = 85 + (9 * BALL_X_DISTANCE);
		static public const BALL_EXTRAS_STARTING_ANGLES: Vector.<Number> = new <Number>[ //
			0.5,
			0.75,
			1,
			1.25,
			1.5,
			1.75,
			1.5,
			1.25,
			1,
			0.75
		];
		static public const BALLS_TRIGGER_INTERVALS_IN_FRAMES: Vector.<int> = new <int>[ //
		3, // 0 
		3, // 1 
		4, // 2 
		5, // 3 
		6, // 4 
		7, // 5 
		8, // 6 
		12, // 7 
		15, // 8 
		20, // 9 
		30];
		
		// interval between last ball callback and collection
		static public const INTERVAL_BETWEEN_LAST_DEFAULT_BALL_AND_COLLECTION: Number = 0.4;

		// card pattern anima parameters		
		static public const PATTERN_PROPAGATE_COLUMN_DELAY : Number = 0.09; // 0.1
		static public const PATTERN_PROPAGATE_CALLBACKS_BY_PATTERN_PRIORITY : Vector.<Number> = new <Number>[ //
			0, // 0
			0.55, // 1
			0.75, // 2
			0.95, // 3
			1.15, // 4
			1.60, // 5
			2.85, // 6
			2.95, // 7
			3.25, // 8
			3.70, // 9
			];
				
		
		// Extra Lights //
		static public const LIGHTS_POSITION : Vector.<Point> = new <Point>[
		new Point(0, -67),
		new Point(27, -63),
		new Point(49, -49),
		new Point(63, -27),
		new Point(67, 0),
		new Point(63, 27),
		new Point(49, 49),
		new Point(26, 64),
		new Point(0, 67),
		new Point(-26, 64),
		new Point(-49, 49),
		new Point(-63, 28),
		new Point(-67, 0),
		new Point(-63, -28),
		new Point(-49, -49),
		new Point(-26, -64)
		];
		// lights 0 ~ 15 //
		static public const LIGHTS_ANIMATION_PATTERNS : Vector.<Array> = new <Array>
		[
		[[0],[1],[2],[3],[4],[5],[6],[7],[8],[9],[10],[11],[12],[13],[14],[15]], // Sequencial //
		[[0],[1, 15],[2, 14],[3, 13],[4, 12],[5, 11],[6, 10],[7, 9],[8],[7, 9],[6, 10],[5, 11],[4, 12],[3, 13],[2, 14],[1, 15]],
		[[0, 2, 4, 6, 8, 10, 12, 14], [1, 3, 5, 7, 9, 11, 13, 15]],
		[[0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15]],
		[[0, 2, 4, 6, 8, 10, 12, 14], [1, 3, 5, 7, 9, 11, 13, 15], [2, 4, 6, 7, 10, 12, 14, 0], [3, 5, 7, 9, 11, 13, 15, 1]]
		];
		
		
		// Bonus Wheel //
		static public const WHEEL_TOP_SPEED : Number = 1;
		static public const WHEEL_ACC : Number = .01;
	}
}
