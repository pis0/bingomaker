package com.assukar.praia.menton.assets.imports
{
    import flash.events.Event
    import flash.events.EventDispatcher
    
    /**
     * @author Johnatan
     */
    public class ImportEventsMenton
    {
        static public var SYNC_SPRITES:Event = new Event("SYNC_SPRITES");
        static public var SYNC_SOUNDS:Event = new Event("SYNC_SOUNDS");
        
        static public var eventDispatcher:EventDispatcher = new EventDispatcher();
        
        static public var syncSounds:Class;
        static public var syncSprites:Class;
        
        static public var particles:Class;
    }
}
