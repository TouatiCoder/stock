<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class StockMovement extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'company_id',
        'material_id',
        'order_id',
        'type',
        'quantity',
        'unit_price',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_price' => 'decimal:2',
        ];
    }

    /**
     * Get the company that owns the stock movement.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the material for the stock movement.
     */
    public function material()
    {
        return $this->belongsTo(Material::class);
    }

    /**
     * Get the order for the stock movement.
     */
    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
